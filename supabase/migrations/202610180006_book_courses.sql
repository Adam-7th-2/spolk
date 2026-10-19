-- Apply once to the existing Spolk database. Does not reset courses or accounts.
begin;
create table if not exists public.book_sources (
 id text primary key,course_id uuid not null unique references public.courses on delete cascade,
 title text not null,total_pages integer not null check(total_pages>0),source_sha256 text not null,notes jsonb not null default '[]'
);
create table if not exists public.book_lesson_details (
 lesson_id uuid primary key references public.lessons on delete cascade,book_id text not null references public.book_sources on delete cascade,
 study_week integer not null check(study_week between 1 and 52),minutes integer not null check(minutes between 1 and 600),
 kind text not null,requires_review boolean not null default false,unique(lesson_id,book_id)
);
create table if not exists public.book_lesson_pages (
 lesson_id uuid not null,book_id text not null,pdf_page integer not null check(pdf_page>0),position integer not null,
 primary key(lesson_id,pdf_page),unique(book_id,pdf_page),foreign key(lesson_id,book_id) references public.book_lesson_details(lesson_id,book_id) on delete cascade
);
alter table public.book_sources enable row level security;
alter table public.book_lesson_details enable row level security;
alter table public.book_lesson_pages enable row level security;
drop policy if exists book_sources_read on public.book_sources;
create policy book_sources_read on public.book_sources for select to authenticated using(public.is_admin() or public.teaches(course_id) or public.enrolled(course_id));
drop policy if exists book_details_read on public.book_lesson_details;
create policy book_details_read on public.book_lesson_details for select to authenticated using(public.can_read_lesson(lesson_id));
drop policy if exists book_pages_read on public.book_lesson_pages;
create policy book_pages_read on public.book_lesson_pages for select to authenticated using(public.can_read_lesson(lesson_id));
revoke all on public.book_sources,public.book_lesson_details,public.book_lesson_pages from anon,authenticated;
grant select on public.book_sources,public.book_lesson_details,public.book_lesson_pages to authenticated;
create or replace function public.install_traveller_course(payload jsonb,student_email text default null,start_date date default current_date,weekly_release boolean default false,sequential_lessons boolean default false) returns uuid
language plpgsql security definer set search_path='' as $$
declare cid uuid; sid uuid; mid uuid; lid uuid; prev_lid uuid; item jsonb; q jsonb; m jsonb; pg jsonb; title_value text; release_time timestamptz; aid uuid; student uuid; position_value integer;
begin
 if not public.is_admin() then raise exception 'Forbidden' using errcode='42501';end if;
 if payload->>'slug'<>'traveller-beginners' or (payload->'source'->>'pageCount')::int<>126 or jsonb_array_length(payload->'lessons')<>71 then raise exception 'Invalid course manifest';end if;
 if student_email is not null and trim(student_email)<>'' then
 select id into student from auth.users where lower(email)=lower(trim(student_email));
 if student is null then raise exception 'Student account not found. Create the account first.';end if;
 if exists(select 1 from public.user_roles where account_id=student and role in ('teacher','admin','super_admin')) then raise exception 'Use a separate student account for the learner enrollment.';end if;
 end if;
 -- Serialize repeated installs; never reset an installed course, learner answers, or grades.
 perform pg_advisory_xact_lock(hashtextextended('spolk.traveller.install',0));
 select course_id into cid from public.book_sources where id='traveller-beginners';
 if cid is not null then
 if student is not null then insert into public.course_enrollments(course_id,account_id) values(cid,student) on conflict do nothing;end if;
 return cid;
 end if;
 select id into sid from public.schools where slug='general';
 if sid is null then raise exception 'General English school is missing. Apply the academy seed first.';end if;
 insert into public.courses(school_id,slug,title,level,description,published)
 values(sid,'traveller-beginners',payload->>'title','A1','An 18-week course covering every supplied original PDF page, teacher-reviewed book exercises and separately labelled Spolk practice.',true) returning id into cid;
 insert into public.book_sources(id,course_id,title,total_pages,source_sha256,notes) values('traveller-beginners',cid,payload->'source'->>'title',126,payload->'source'->>'sha256',payload->'source'->'notes');
 insert into public.course_instructors(course_id,account_id) values(cid,auth.uid());
 for m in select value from jsonb_array_elements(payload->'modules') loop
 insert into public.modules(id,course_id,title,position) values((m->>'id')::uuid,cid,m->>'title',(m->>'position')::int);
 end loop;
 for item in select value from jsonb_array_elements(payload->'lessons') loop
 lid=(item->>'id')::uuid;
 release_time=(start_date::timestamp at time zone 'UTC')+case when weekly_release and item->>'kind'<>'reference' then make_interval(days=>7*((item->>'week')::int-1)) else interval '0 days' end;
 insert into public.lessons(id,module_id,course_id,title,body,position,released_at) values(lid,(item->>'module_id')::uuid,cid,item->>'title',item->>'body',(item->>'position')::int,release_time);
 insert into public.book_lesson_details(lesson_id,book_id,study_week,minutes,kind,requires_review) values(lid,'traveller-beginners',(item->>'week')::int,(item->>'minutes')::int,item->>'kind',jsonb_typeof(item->'assignment')='object');
 position_value=0;
 for pg in select value from jsonb_array_elements(item->'pages') loop
 insert into public.book_lesson_pages(lesson_id,book_id,pdf_page,position) values(lid,'traveller-beginners',pg::text::int,position_value);
 position_value=position_value+1;
 end loop;
 if sequential_lessons and prev_lid is not null and item->>'kind'<>'reference' then insert into public.lesson_prerequisites(lesson_id,prerequisite_id) values(lid,prev_lid);end if;
 prev_lid=lid;
 if jsonb_typeof(item->'assignment')='object' then
 insert into public.assignments(id,lesson_id,course_id,title,instructions,due_at) values((item->'assignment'->>'id')::uuid,lid,cid,item->'assignment'->>'title',item->'assignment'->>'instructions',(start_date::timestamp at time zone 'UTC')+make_interval(days=>7*(item->>'week')::int));
 end if;
 if jsonb_array_length(item->'questions')>0 then
 aid=(item->>'assessment_id')::uuid;
 insert into public.assessments(id,course_id,lesson_id,title,time_limit_seconds,attempt_limit,passing_score) values(aid,cid,lid,'Spolk practice: '||(item->>'title'),900,5,70);
 for q in select value from jsonb_array_elements(item->'questions') loop
 insert into public.assessment_questions(id,assessment_id,kind,prompt,options,correct_answer,points,position) values((q->>'id')::uuid,aid,q->>'kind',q->>'prompt',q->'options',q->>'correct_answer',(q->>'points')::numeric,(q->>'position')::int);
 end loop;
 end if;
 end loop;
 if (select count(*) from public.book_lesson_pages where book_id='traveller-beginners')<>126 or (select min(pdf_page) from public.book_lesson_pages where book_id='traveller-beginners')<>1 or (select max(pdf_page) from public.book_lesson_pages where book_id='traveller-beginners')<>126 then raise exception 'Source page coverage is incomplete';end if;
 if student is not null then insert into public.course_enrollments(course_id,account_id) values(cid,student) on conflict do nothing;end if;
 insert into public.audit_logs(actor_id,event,resource_id) values(auth.uid(),'traveller.course_installed',cid);
 return cid;
end;$$;
revoke all on function public.install_traveller_course(jsonb,text,date,boolean,boolean) from public,anon;
grant execute on function public.install_traveller_course(jsonb,text,date,boolean,boolean) to authenticated;
create or replace function public.complete_lesson(lid uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.can_read_lesson(lid) then raise exception 'Forbidden' using errcode='42501';end if;
 if exists(select 1 from public.assessments a where a.lesson_id=lid and not exists(select 1 from public.assessment_attempts t where t.assessment_id=a.id and t.account_id=auth.uid() and t.submitted_at is not null and t.score>=a.passing_score)) then raise exception 'Pass the lesson assessments first';end if;
 if exists(select 1 from public.book_lesson_details b where b.lesson_id=lid and b.requires_review) and exists(select 1 from public.assignments a where a.lesson_id=lid and not exists(select 1 from public.submissions s join public.grades g on g.submission_id=s.id where s.assignment_id=a.id and s.account_id=auth.uid() and g.score>=70)) then raise exception 'Submit the original-page work and receive teacher approval first';end if;
 insert into public.lesson_progress(account_id,lesson_id) values(auth.uid(),lid) on conflict do nothing;
end;$$;
notify pgrst, 'reload schema';
commit;
