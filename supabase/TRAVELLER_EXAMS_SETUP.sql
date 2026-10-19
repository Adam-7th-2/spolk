-- Add scheduled original exams to the EXISTING Traveller course. Apply in a new SQL Editor query.
begin;
create table if not exists public.traveller_exams (
 id text primary key,course_id uuid not null references public.courses on delete cascade,
 lesson_id uuid not null unique references public.lessons on delete cascade,assignment_id uuid not null unique references public.assignments on delete cascade,
 title text not null,study_week int not null check(study_week between 1 and 18),opens_at timestamptz not null,closes_at timestamptz not null,
 minutes int not null check(minutes between 5 and 180),max_marks int not null check(max_marks>0),check(closes_at>opens_at)
);
create table if not exists public.traveller_exam_sittings (
 id uuid primary key default gen_random_uuid(),exam_id text not null references public.traveller_exams on delete cascade,
 account_id uuid not null references public.profiles on delete cascade,started_at timestamptz not null default now(),deadline timestamptz not null,
 draft jsonb not null default '{}',submitted_at timestamptz,submission_id uuid references public.submissions on delete set null,
 expired_submission boolean not null default false,unique(exam_id,account_id)
);
alter table public.traveller_exams enable row level security;
alter table public.traveller_exam_sittings enable row level security;
drop policy if exists exam_schedule_read on public.traveller_exams;
create policy exam_schedule_read on public.traveller_exams for select to authenticated using(public.is_admin() or public.teaches(course_id) or public.enrolled(course_id));
drop policy if exists exam_sitting_read on public.traveller_exam_sittings;
create policy exam_sitting_read on public.traveller_exam_sittings for select to authenticated using(account_id=auth.uid() or public.is_admin() or exists(select 1 from public.traveller_exams e where e.id=exam_id and public.teaches(e.course_id)));
revoke all on public.traveller_exams,public.traveller_exam_sittings from anon,authenticated;
grant select on public.traveller_exams,public.traveller_exam_sittings to authenticated;
create or replace function public.install_traveller_exams(payload jsonb,start_date date default current_date) returns uuid language plpgsql security definer set search_path='' as $$
declare cid uuid; item jsonb; opening timestamptz; lid uuid; aid uuid; begin
 if not public.is_admin() then raise exception 'Forbidden' using errcode='42501';end if;
 if payload->>'courseSlug'<>'traveller-beginners' or jsonb_array_length(payload->'exams')<>10 then raise exception 'Invalid exam manifest';end if;
 select course_id into cid from public.book_sources where id='traveller-beginners';
 if cid is null then raise exception 'Install Traveller Beginners first';end if;
 perform pg_advisory_xact_lock(hashtextextended('spolk.traveller.exams',0));
 for item in select value from jsonb_array_elements(payload->'exams') loop
 if exists(select 1 from public.traveller_exams where id=item->>'id') then continue;end if;
 lid=(item->>'lessonId')::uuid;aid=(item->>'assignmentId')::uuid;
 opening=(start_date::timestamp at time zone 'UTC')+make_interval(days=>7*((item->>'week')::int-1));
 insert into public.lessons(id,module_id,course_id,title,body,position,released_at) values(lid,(item->>'moduleId')::uuid,cid,item->>'title','Complete the original test paper using its matching listening track. Enter answers by original page and exercise number. The timer and submission deadline are enforced by the server. Your teacher grades the original work; results are not fabricated.',(item->>'position')::int,opening);
 insert into public.book_lesson_details(lesson_id,book_id,study_week,minutes,kind,requires_review) values(lid,'traveller-beginners',(item->>'week')::int,(item->>'minutes')::int,'exam',true);
 insert into public.assignments(id,lesson_id,course_id,title,instructions,due_at) values(aid,lid,cid,'Exam submission: '||(item->>'title'),'Use the timed exam form above. Answer every original task by page and exercise number. Teacher grading is shown as a percentage; the original paper total is displayed on the exam.',opening+interval '7 days');
 insert into public.traveller_exams(id,course_id,lesson_id,assignment_id,title,study_week,opens_at,closes_at,minutes,max_marks) values(item->>'id',cid,lid,aid,item->>'title',(item->>'week')::int,opening,opening+interval '7 days',(item->>'minutes')::int,(item->>'maxMarks')::int);
 end loop;
 insert into public.audit_logs(actor_id,event,resource_id) values(auth.uid(),'traveller.exams_prepared',cid);return cid;
end;$$;
create or replace function public.start_traveller_exam(eid text) returns jsonb language plpgsql security definer set search_path='' as $$
declare exam public.traveller_exams; sitting public.traveller_exam_sittings; begin
 select * into exam from public.traveller_exams where id=eid for share;
 if not found or not public.enrolled(exam.course_id) or not public.can_read_lesson(exam.lesson_id) then raise exception 'Forbidden' using errcode='42501';end if;
 if now()<exam.opens_at or now()>=exam.closes_at then raise exception 'This exam is outside its scheduled window';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||eid,0));
 select * into sitting from public.traveller_exam_sittings where exam_id=eid and account_id=auth.uid();
 if found then
 if sitting.submitted_at is not null then raise exception 'Exam already submitted';end if;
 if sitting.deadline<=now() then raise exception 'Your exam time has expired. Submit your saved draft.';end if;
 else
 insert into public.traveller_exam_sittings(exam_id,account_id,deadline) values(eid,auth.uid(),least(now()+make_interval(mins=>exam.minutes),exam.closes_at)) returning * into sitting;
 end if;
 return jsonb_build_object('deadline',sitting.deadline,'draft',sitting.draft);
end;$$;
create or replace function public.save_traveller_exam_draft(eid text,answers jsonb) returns void language plpgsql security definer set search_path='' as $$begin
 if jsonb_typeof(answers)<>'object' or length(answers::text)>18000 then raise exception 'Invalid draft';end if;
 update public.traveller_exam_sittings set draft=answers where exam_id=eid and account_id=auth.uid() and submitted_at is null and deadline>now() and exists(select 1 from public.traveller_exams e where e.id=eid and public.enrolled(e.course_id) and now()<e.closes_at);
 if not found then raise exception 'Your draft could not be saved: exam time ended or access changed';end if;
end;$$;
create or replace function public.submit_traveller_exam(eid text,answers jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare sitting public.traveller_exam_sittings; exam public.traveller_exams; sid uuid; final_answers jsonb; body_value text; late boolean;begin
 select * into exam from public.traveller_exams where id=eid;
 if not found or not public.enrolled(exam.course_id) then raise exception 'Forbidden' using errcode='42501';end if;
 select * into sitting from public.traveller_exam_sittings where exam_id=eid and account_id=auth.uid() for update;
 if not found then raise exception 'Start the exam first';end if;
 if sitting.submitted_at is not null then return sitting.submission_id;end if;
 if jsonb_typeof(answers)<>'object' or length(answers::text)>18000 then raise exception 'Invalid answers';end if;
 late=now()>sitting.deadline;
 -- After expiry, only the last draft accepted before the deadline is submitted.
 final_answers=case when late then sitting.draft else answers end;
 select coalesce(string_agg(key||E'\n'||value,E'\n\n' order by key),'No answers saved before deadline.') into body_value from jsonb_each_text(final_answers);
 body_value=exam.title||E'\nOriginal total: '||exam.max_marks||E'\n'||case when late then 'Time expired: last server-saved draft.' else 'Submitted within exam time.' end||E'\n\n'||body_value;
 insert into public.submissions(assignment_id,account_id,body) values(exam.assignment_id,auth.uid(),body_value) returning id into sid;
 update public.traveller_exam_sittings set draft=final_answers,submitted_at=now(),submission_id=sid,expired_submission=late where id=sitting.id;
 return sid;
end;$$;
create or replace function public.can_read_traveller_exam_media(eid text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.traveller_exams e where e.id=eid and (public.is_admin() or public.teaches(e.course_id) or (public.enrolled(e.course_id) and public.can_read_lesson(e.lesson_id) and now()>=e.opens_at and now()<e.closes_at and exists(select 1 from public.traveller_exam_sittings s where s.exam_id=e.id and s.account_id=auth.uid() and s.submitted_at is null and now()<s.deadline))))
$$;
create or replace function public.reschedule_traveller_exam(eid text,opens timestamptz,closes timestamptz,duration int) returns void language plpgsql security definer set search_path='' as $$
declare exam public.traveller_exams;begin
 if not public.is_admin() then raise exception 'Forbidden' using errcode='42501';end if;
 select * into exam from public.traveller_exams where id=eid for update;
 if not found then raise exception 'Unknown exam';end if;
 if exists(select 1 from public.traveller_exam_sittings where exam_id=eid) then raise exception 'Cannot reschedule an exam after a student has started';end if;
 if closes<=opens or duration not between 5 and 180 then raise exception 'Invalid schedule';end if;
 update public.traveller_exams set opens_at=opens,closes_at=closes,minutes=duration where id=eid;
 update public.lessons set released_at=opens where id=exam.lesson_id;
 update public.assignments set due_at=closes where id=exam.assignment_id;
 insert into public.audit_logs(actor_id,event,resource_id) values(auth.uid(),'exam.rescheduled',exam.lesson_id);
end;$$;
drop policy if exists submissions_create on public.submissions;
create policy submissions_create on public.submissions for insert to authenticated with check(account_id=auth.uid() and not exists(select 1 from public.traveller_exams e where e.assignment_id=submissions.assignment_id) and exists(select 1 from public.assignments a where a.id=assignment_id and public.can_read_lesson(a.lesson_id) and (a.due_at is null or a.due_at>now())));
revoke all on function public.install_traveller_exams(jsonb,date),public.start_traveller_exam(text),public.save_traveller_exam_draft(text,jsonb),public.submit_traveller_exam(text,jsonb),public.can_read_traveller_exam_media(text),public.reschedule_traveller_exam(text,timestamptz,timestamptz,int) from public,anon;
grant execute on function public.install_traveller_exams(jsonb,date),public.start_traveller_exam(text),public.save_traveller_exam_draft(text,jsonb),public.submit_traveller_exam(text,jsonb),public.can_read_traveller_exam_media(text),public.reschedule_traveller_exam(text,timestamptz,timestamptz,int) to authenticated;
notify pgrst,'reload schema';
commit;
