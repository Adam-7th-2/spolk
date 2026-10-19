-- Additive upgrade: progress locks, private homework files, teacher conversations and notifications.
alter table public.profiles add column if not exists first_name text not null default '' check(length(first_name)<=80);
alter table public.profiles add column if not exists last_name text not null default '' check(length(last_name)<=80);
alter table public.profiles add column if not exists country text not null default '' check(length(country)<=100);
alter table public.profiles add column if not exists city text not null default '' check(length(city)<=100);
alter table public.profiles add column if not exists english_level text not null default 'Not sure' check(english_level in ('Not sure','A1','A2','B1','B2','C1','C2'));
alter table public.profiles add column if not exists learning_goal text not null default '' check(length(learning_goal)<=2000);
alter table public.profiles add column if not exists email_notifications boolean not null default true;
alter table public.notifications add column if not exists href text not null default '/workspace/notifications';

create or replace function public.can_read_lesson(lid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.lessons l join public.modules m on m.id=l.module_id
 where l.id=lid and (public.is_admin() or public.teaches(l.course_id) or
 (public.enrolled(l.course_id) and l.released_at<=now()
 and not exists(select 1 from public.lesson_prerequisites p where p.lesson_id=l.id and not exists(select 1 from public.lesson_progress d where d.lesson_id=p.prerequisite_id and d.account_id=auth.uid()))
 and (exists(select 1 from public.lesson_progress d where d.lesson_id=l.id and d.account_id=auth.uid())
 or exists(select 1 from public.book_lesson_details b where b.lesson_id=l.id and b.kind='reference')
 or not exists(select 1 from public.lessons earlier join public.modules em on em.id=earlier.module_id
 where earlier.course_id=l.course_id and (em.position,earlier.position,earlier.id)<(m.position,l.position,l.id)
 and not exists(select 1 from public.book_lesson_details b where b.lesson_id=earlier.id and b.kind in ('reference','exam'))
 and not exists(select 1 from public.lesson_progress d where d.lesson_id=earlier.id and d.account_id=auth.uid()))))))
$$;
create or replace function public.course_learning_outline(cid uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'title',l.title,'module_id',l.module_id,'position',l.position,'available',public.can_read_lesson(l.id)) order by m.position,l.position,l.id),'[]')
 from public.lessons l join public.modules m on m.id=l.module_id where l.course_id=cid and (public.enrolled(cid) or public.teaches(cid) or public.is_admin())
$$;
create or replace function public.my_course_progress() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'course_id',e.course_id,'status',e.status,'total',(select count(*) from public.lessons l where l.course_id=e.course_id),'completed',(select count(*) from public.lesson_progress p join public.lessons l on l.id=p.lesson_id where p.account_id=auth.uid() and l.course_id=e.course_id))),'[]') from public.course_enrollments e where e.account_id=auth.uid()
$$;

create table if not exists public.submission_files(
 id uuid primary key,submission_id uuid not null references public.submissions on delete cascade,
 original_name text not null check(length(original_name) between 1 and 180),mime_type text not null,
 size_bytes int not null check(size_bytes between 1 and 10485760),created_at timestamptz not null default now()
);
alter table public.submission_files enable row level security;
drop policy if exists submission_files_read on public.submission_files;
create policy submission_files_read on public.submission_files for select to authenticated using(exists(select 1 from public.submissions s where s.id=submission_id));
grant select on public.submission_files to authenticated;
create or replace function public.submit_homework_files(aid uuid,answer text,files jsonb) returns uuid language plpgsql security definer set search_path='' as $$
 declare a public.assignments; sid uuid; f jsonb;begin
 select * into a from public.assignments where id=aid;
 if not found or auth.uid() is null or not public.can_read_lesson(a.lesson_id) or not public.enrolled(a.course_id) then raise exception 'Forbidden' using errcode='42501';end if;
 if exists(select 1 from public.traveller_exams e where e.assignment_id=aid) then raise exception 'Use the timed exam submission';end if;
 if a.due_at is not null and a.due_at<=now() then raise exception 'The assignment deadline has passed';end if;
 if answer is null or length(answer)>20000 or files is null or jsonb_typeof(files)<>'array' or jsonb_array_length(files)>3 then raise exception 'Invalid submission';end if;
 if length(trim(answer))=0 and jsonb_array_length(files)=0 then raise exception 'Add your answer or a file';end if;
 insert into public.submissions(assignment_id,account_id,body) values(aid,auth.uid(),coalesce(nullif(trim(answer),''),'See attached assignment files.')) returning id into sid;
 for f in select value from jsonb_array_elements(files) loop
 if f->>'type' not in ('application/pdf','text/plain','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document') then raise exception 'Unsupported file';end if;
 insert into public.submission_files(id,submission_id,original_name,mime_type,size_bytes) values((f->>'id')::uuid,sid,f->>'name',f->>'type',(f->>'size')::int);
 end loop;
 return sid;
 end;$$;

create table if not exists public.lesson_questions(
 id uuid primary key default gen_random_uuid(),lesson_id uuid not null references public.lessons on delete cascade,
 course_id uuid not null references public.courses on delete cascade,student_id uuid not null references public.profiles on delete cascade,
 section text not null check(section in ('watch','read','practice','homework','notes','complete','exam')),
 subject text not null check(length(subject) between 3 and 180),created_at timestamptz not null default now(),
 foreign key(lesson_id,course_id) references public.lessons(id,course_id)
);
create table if not exists public.lesson_question_messages(
 id uuid primary key default gen_random_uuid(),question_id uuid not null references public.lesson_questions on delete cascade,
 author_id uuid not null references public.profiles on delete cascade,body text not null check(length(body) between 1 and 5000),created_at timestamptz not null default now()
);
alter table public.lesson_questions enable row level security;
alter table public.lesson_question_messages enable row level security;
drop policy if exists question_read on public.lesson_questions;
create policy question_read on public.lesson_questions for select to authenticated using(student_id=auth.uid() or public.is_admin() or public.teaches(course_id));
drop policy if exists question_message_read on public.lesson_question_messages;
create policy question_message_read on public.lesson_question_messages for select to authenticated using(exists(select 1 from public.lesson_questions q where q.id=question_id));
grant select on public.lesson_questions,public.lesson_question_messages to authenticated;
create index if not exists questions_course_idx on public.lesson_questions(course_id,created_at desc);

create or replace function public.notify_course_staff(cid uuid,kind text,message text,target text,exclude_id uuid default null) returns void language sql security definer set search_path='' as $$
 insert into public.notifications(account_id,event,body,href)
 select distinct r.account_id,kind,message,target from (select account_id from public.course_instructors where course_id=cid union select account_id from public.user_roles where role in ('admin','super_admin')) r where r.account_id is distinct from exclude_id
$$;
revoke all on function public.notify_course_staff(uuid,text,text,text,uuid) from public,anon,authenticated;

create or replace function public.ask_lesson_question(lid uuid,section_id text,topic text,message text) returns uuid language plpgsql security definer set search_path='' as $$
 declare cid uuid;qid uuid;begin
 select course_id into cid from public.lessons where id=lid;
 if cid is null or not public.enrolled(cid) or not public.can_read_lesson(lid) then raise exception 'Forbidden' using errcode='42501';end if;
 if length(trim(topic)) not between 3 and 180 or length(trim(message)) not between 1 and 5000 then raise exception 'Enter your question';end if;
 insert into public.lesson_questions(lesson_id,course_id,student_id,section,subject) values(lid,cid,auth.uid(),section_id,trim(topic)) returning id into qid;
 insert into public.lesson_question_messages(question_id,author_id,body) values(qid,auth.uid(),trim(message));
 perform public.notify_course_staff(cid,'student_question','A student asked: '||trim(topic),'/workspace/messages/'||qid,auth.uid());
 return qid;
 end;$$;
create or replace function public.reply_lesson_question(qid uuid,message text) returns void language plpgsql security definer set search_path='' as $$
 declare q public.lesson_questions;begin
 select * into q from public.lesson_questions where id=qid for update;
 if not found or auth.uid() is null or not(q.student_id=auth.uid() or public.is_admin() or public.teaches(q.course_id)) then raise exception 'Forbidden' using errcode='42501';end if;
 if q.student_id=auth.uid() and not public.enrolled(q.course_id) then raise exception 'Enrollment no longer active';end if;
 if message is null or length(trim(message)) not between 1 and 5000 then raise exception 'Enter your reply';end if;
 insert into public.lesson_question_messages(question_id,author_id,body) values(qid,auth.uid(),trim(message));
 if q.student_id=auth.uid() then
 perform public.notify_course_staff(q.course_id,'student_reply','A student replied: '||q.subject,'/workspace/messages/'||qid,auth.uid());
 else
 insert into public.notifications(account_id,event,body,href) values(q.student_id,'teacher_reply','Your teacher replied: '||q.subject,'/workspace/messages/'||qid);
 perform public.notify_course_staff(q.course_id,'staff_reply','A teacher replied: '||q.subject,'/workspace/messages/'||qid,auth.uid());
 end if;
 end;$$;

create table if not exists public.notification_emails(
 id uuid primary key default gen_random_uuid(),notification_id uuid not null unique references public.notifications on delete cascade,
 account_id uuid not null references public.profiles on delete cascade,recipient text not null,subject text not null,body text not null,href text not null,
 created_at timestamptz not null default now(),sent_at timestamptz,attempts int not null default 0,locked_until timestamptz,last_error text
);
alter table public.notification_emails enable row level security;
drop policy if exists email_preview_admin on public.notification_emails;
create policy email_preview_admin on public.notification_emails for select to authenticated using(public.is_admin());
grant select on public.notification_emails to authenticated;
create or replace function public.queue_notification_email() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.notification_emails(notification_id,account_id,recipient,subject,body,href)
 select new.id,new.account_id,u.email,'Spolk: '||replace(new.event,'_',' '),new.body,new.href from auth.users u join public.profiles p on p.id=u.id where u.id=new.account_id and u.email is not null and p.email_notifications;
 return new;end;$$;
drop trigger if exists notification_email_queue on public.notifications;
create trigger notification_email_queue after insert on public.notifications for each row execute function public.queue_notification_email();

create or replace function public.workspace_event_notification() returns trigger language plpgsql security definer set search_path='' as $$
 declare cid uuid;lid uuid;uid uuid;target text;title_value text;begin
 if tg_table_name='submissions' then
 select course_id,lesson_id,title into cid,lid,title_value from public.assignments where id=new.assignment_id;
 perform public.notify_course_staff(cid,'homework_submitted','New assignment submitted: '||title_value,'/teacher',new.account_id);
 insert into public.notifications(account_id,event,body,href) values(new.account_id,'submission_received','Your assignment was submitted: '||title_value,'/learn/'||lid);
 elsif tg_table_name='grades' then
 select s.account_id,a.lesson_id,a.title into uid,lid,title_value from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=new.submission_id;
 insert into public.notifications(account_id,event,body,href) values(uid,'teacher_feedback','Your assignment has new teacher feedback: '||title_value,'/learn/'||lid);
 elsif tg_table_name='lesson_progress' then
 insert into public.notifications(account_id,event,body,href) select new.account_id,'lesson_completed','Lesson completed: '||l.title||'. Your learning path has been updated.','/dashboard/courses/'||l.course_id from public.lessons l where l.id=new.lesson_id;
 elsif tg_table_name='announcements' then
 insert into public.notifications(account_id,event,body,href) select account_id,'course_announcement',left(new.body,1000),'/dashboard/courses/'||new.course_id from public.course_enrollments where course_id=new.course_id and status='active';
 elsif tg_table_name='live_sessions' then
 insert into public.notifications(account_id,event,body,href) select account_id,'class_schedule_updated','Class schedule updated: '||new.title,'/dashboard/schedule' from public.course_enrollments where course_id=new.course_id and status='active';
 end if;
 return new;end;$$;
drop trigger if exists homework_notice on public.submissions;
create trigger homework_notice after insert on public.submissions for each row execute function public.workspace_event_notification();
drop trigger if exists grade_notice on public.grades;
create trigger grade_notice after insert or update on public.grades for each row execute function public.workspace_event_notification();
drop trigger if exists progress_notice on public.lesson_progress;
create trigger progress_notice after insert on public.lesson_progress for each row execute function public.workspace_event_notification();
drop trigger if exists announcement_notice on public.announcements;
create trigger announcement_notice after insert on public.announcements for each row execute function public.workspace_event_notification();
drop trigger if exists schedule_notice on public.live_sessions;
create trigger schedule_notice after insert or update of starts_at,ends_at,cancelled_at on public.live_sessions for each row execute function public.workspace_event_notification();
revoke all on function public.queue_notification_email(),public.workspace_event_notification() from public,anon,authenticated;

-- Only the trusted delivery worker claims mail. Ordinary accounts cannot change delivery state.
create or replace function public.claim_notification_emails() returns setof public.notification_emails language sql security definer set search_path='' as $$
 update public.notification_emails set locked_until=now()+interval '10 minutes',attempts=attempts+1 where id in (
 select id from public.notification_emails where sent_at is null and attempts<5 and (locked_until is null or locked_until<now()) order by created_at limit 20 for update skip locked) returning *
$$;
create or replace function public.finish_notification_email(eid uuid,succeeded boolean,problem text default null) returns void language sql security definer set search_path='' as $$
 update public.notification_emails set sent_at=case when succeeded then now() else null end,last_error=left(problem,500),locked_until=case when succeeded then null else now()+interval '5 minutes' end where id=eid
$$;
revoke all on function public.claim_notification_emails(),public.finish_notification_email(uuid,boolean,text) from public,anon,authenticated;
do $$begin if exists(select 1 from pg_roles where rolname='service_role') then
 grant execute on function public.claim_notification_emails(),public.finish_notification_email(uuid,boolean,text) to service_role;
 end if;end$$;
revoke all on function public.course_learning_outline(uuid),public.my_course_progress(),public.submit_homework_files(uuid,text,jsonb),public.ask_lesson_question(uuid,text,text,text),public.reply_lesson_question(uuid,text) from public,anon;
grant execute on function public.course_learning_outline(uuid),public.my_course_progress(),public.submit_homework_files(uuid,text,jsonb),public.ask_lesson_question(uuid,text,text,text),public.reply_lesson_question(uuid,text) to authenticated;
notify pgrst,'reload schema';
