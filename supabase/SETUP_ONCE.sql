-- SPOLK: first-time setup for an EMPTY Supabase project. Run once.
-- Includes migrations, explicit API grants, and sample curriculum.
begin;

-- SOURCE: 202610180001_foundation.sql
-- Spolk foundation. Apply to a Supabase PostgreSQL project.

create extension if not exists pgcrypto;
create extension if not exists vector;
create type public.academy_role as enum ('student','teacher','guardian','admin','super_admin');
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 display_name text not null default 'Learner' check (length(display_name) between 1 and 100),
 interface_language text not null default 'en' check (interface_language in ('en','ru','am')),
 explanation_language text not null default 'en' check (explanation_language in ('en','ru','am')),
 timezone text not null default 'UTC', created_at timestamptz not null default now()
);
create table public.user_roles(account_id uuid references public.profiles on delete cascade,role public.academy_role not null,primary key(account_id,role));
create function public.has_role(wanted public.academy_role) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.user_roles where account_id=auth.uid() and role=wanted)$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select public.has_role('admin') or public.has_role('super_admin')$$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.profiles(id) values(new.id); insert into public.user_roles(account_id,role) values(new.id,'student'); return new; end;$$;
create trigger create_academy_profile after insert on auth.users for each row execute function public.handle_new_user();
create table public.guardian_links(guardian_id uuid references public.profiles on delete cascade,student_id uuid references public.profiles on delete cascade,verified_at timestamptz,primary key(guardian_id,student_id),check(guardian_id<>student_id));
create table public.schools(id uuid primary key default gen_random_uuid(),name text not null unique,slug text not null unique,description text not null default '',published boolean not null default false);
create table public.programs(id uuid primary key default gen_random_uuid(),school_id uuid not null references public.schools,name text not null,description text not null default '');
create table public.courses(id uuid primary key default gen_random_uuid(),school_id uuid not null references public.schools,program_id uuid references public.programs,slug text not null unique,title text not null,level text not null check(level in ('A1','A2','B1','B2','C1','C2')),description text not null default '',published boolean not null default false);
create table public.course_instructors(course_id uuid references public.courses on delete cascade,account_id uuid references public.profiles on delete cascade,primary key(course_id,account_id));
create table public.course_enrollments(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses on delete cascade,account_id uuid not null references public.profiles on delete cascade,status text not null default 'active' check(status in ('active','completed','withdrawn')),created_at timestamptz not null default now(),unique(course_id,account_id));
create function public.teaches(cid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.course_instructors where course_id=cid and account_id=auth.uid())$$;
create function public.enrolled(cid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.course_enrollments where course_id=cid and account_id=auth.uid() and status='active')$$;
create table public.enrollment_applications(id uuid primary key default gen_random_uuid(),account_id uuid not null references public.profiles on delete cascade,course_slug text not null references public.courses(slug),goal text not null check(length(goal) between 10 and 2000),level text not null check(level in ('Not sure','A1','A2','B1','B2','C1','C2')),explanation_language text not null check(explanation_language in ('en','ru','am')),status text not null default 'pending' check(status in ('pending','approved','declined')),created_at timestamptz not null default now(),unique(account_id,course_slug));
create table public.modules(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses on delete cascade,title text not null,position integer not null check(position>=0),unique(course_id,position));
create table public.lessons(id uuid primary key default gen_random_uuid(),module_id uuid not null references public.modules on delete cascade,course_id uuid not null references public.courses on delete cascade,title text not null,body text not null default '',position integer not null default 0,released_at timestamptz,unique(module_id,position));
create table public.lesson_prerequisites(lesson_id uuid references public.lessons on delete cascade,prerequisite_id uuid references public.lessons on delete cascade,primary key(lesson_id,prerequisite_id),check(lesson_id<>prerequisite_id));
create table public.lesson_progress(account_id uuid references public.profiles on delete cascade,lesson_id uuid references public.lessons on delete cascade,completed_at timestamptz not null default now(),primary key(account_id,lesson_id));
create function public.can_read_lesson(lid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.lessons l where l.id=lid and (public.is_admin() or public.teaches(l.course_id) or (public.enrolled(l.course_id) and l.released_at<=now() and not exists(select 1 from public.lesson_prerequisites p where p.lesson_id=l.id and not exists(select 1 from public.lesson_progress done where done.lesson_id=p.prerequisite_id and done.account_id=auth.uid())))))$$;
create table public.lesson_assets(id uuid primary key default gen_random_uuid(),lesson_id uuid not null references public.lessons on delete cascade,storage_path text not null,mime_type text not null,size_bytes bigint not null check(size_bytes>0 and size_bytes<=10485760));
create table public.assignments(id uuid primary key default gen_random_uuid(),lesson_id uuid not null references public.lessons on delete cascade,course_id uuid not null references public.courses on delete cascade,title text not null,instructions text not null,due_at timestamptz);
create table public.submissions(id uuid primary key default gen_random_uuid(),assignment_id uuid not null references public.assignments on delete cascade,account_id uuid not null references public.profiles on delete cascade,body text not null check(length(body)<=20000),submitted_at timestamptz not null default now(),unique(assignment_id,account_id));
create table public.grades(id uuid primary key default gen_random_uuid(),submission_id uuid not null unique references public.submissions on delete cascade,grader_id uuid not null references public.profiles,score numeric not null check(score between 0 and 100),feedback text not null default '',graded_at timestamptz not null default now());
create table public.live_sessions(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses on delete cascade,title text not null,starts_at timestamptz not null,ends_at timestamptz not null,recording_allowed boolean not null default false,check(ends_at>starts_at));
create table public.live_session_invites(session_id uuid references public.live_sessions on delete cascade,account_id uuid references public.profiles on delete cascade,expires_at timestamptz not null,primary key(session_id,account_id));
create table public.attendance_events(id uuid primary key default gen_random_uuid(),session_id uuid references public.live_sessions on delete cascade,account_id uuid references public.profiles on delete cascade,event text not null check(event in ('join','leave')),created_at timestamptz not null default now());
create table public.recording_metadata(id uuid primary key default gen_random_uuid(),session_id uuid references public.live_sessions on delete cascade,created_by uuid references public.profiles,storage_path text not null,consent_verified boolean not null default false,created_at timestamptz not null default now());
create table public.user_notes(id uuid primary key default gen_random_uuid(),account_id uuid not null references public.profiles on delete cascade,lesson_id uuid references public.lessons on delete cascade,body text not null check(length(body)<=20000),updated_at timestamptz not null default now());
create table public.notifications(id uuid primary key default gen_random_uuid(),account_id uuid not null references public.profiles on delete cascade,event text not null,body text not null,read_at timestamptz,created_at timestamptz not null default now());
create table public.announcements(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses on delete cascade,body text not null,created_at timestamptz not null default now());
create table public.ai_knowledge_documents(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses on delete cascade,title text not null,uploaded_by uuid not null references public.profiles,created_at timestamptz not null default now());
create table public.ai_document_chunks(id uuid primary key default gen_random_uuid(),document_id uuid not null references public.ai_knowledge_documents on delete cascade,content text not null,position integer not null,embedding vector(768),unique(document_id,position));
create table public.ai_conversations(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses on delete cascade,account_id uuid not null references public.profiles on delete cascade,created_at timestamptz not null default now());
create table public.ai_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.ai_conversations on delete cascade,role text not null check(role in ('user','assistant')),content text not null,created_at timestamptz not null default now());
create table public.speaking_sessions(id uuid primary key default gen_random_uuid(),account_id uuid not null references public.profiles on delete cascade,mode text not null,explanation_language text not null default 'en',transcript text not null default '',feedback text,created_at timestamptz not null default now());
create table public.consent_records(id uuid primary key default gen_random_uuid(),account_id uuid not null references public.profiles on delete cascade,guardian_id uuid references public.profiles,kind text not null,policy_version text not null,granted boolean not null,created_at timestamptz not null default now());
create table public.certificates(id uuid primary key default gen_random_uuid(),account_id uuid not null references public.profiles on delete cascade,course_id uuid not null references public.courses,issued_at timestamptz not null default now(),public_verification boolean not null default false,unique(account_id,course_id));
create table public.audit_logs(id uuid primary key default gen_random_uuid(),actor_id uuid references public.profiles,event text not null,resource_id uuid,created_at timestamptz not null default now());
create table public.usage_counters(account_id uuid references public.profiles on delete cascade,period date not null,kind text not null,amount bigint not null default 0 check(amount>=0),primary key(account_id,period,kind));
create table public.application_settings(key text primary key,value jsonb not null,updated_at timestamptz not null default now());
-- Deny by default on EVERY application table, including future tables in this migration.
do $$declare t record;begin for t in select tablename from pg_tables where schemaname='public' loop execute format('alter table public.%I enable row level security',t.tablename);end loop;end$$;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profile_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy role_read on public.user_roles for select to authenticated using(account_id=auth.uid() or public.is_admin());
create policy roles_manage on public.user_roles for all to authenticated using(public.has_role('super_admin')) with check(public.has_role('super_admin'));
create policy guardian_read on public.guardian_links for select to authenticated using(guardian_id=auth.uid() or student_id=auth.uid() or public.is_admin());
create policy guardian_manage on public.guardian_links for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy schools_read on public.schools for select using(published or public.is_admin());
create policy schools_manage on public.schools for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy courses_read on public.courses for select using(published or public.is_admin() or public.teaches(id) or public.enrolled(id));
create policy courses_manage on public.courses for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy instructors_read on public.course_instructors for select to authenticated using(account_id=auth.uid() or public.is_admin());
create policy instructors_manage on public.course_instructors for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy enrollment_read on public.course_enrollments for select to authenticated using(account_id=auth.uid() or public.teaches(course_id) or public.is_admin() or exists(select 1 from public.guardian_links g where g.guardian_id=auth.uid() and g.student_id=account_id and g.verified_at is not null));
create policy enrollment_manage on public.course_enrollments for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy applications_read on public.enrollment_applications for select to authenticated using(account_id=auth.uid() or public.is_admin());
create policy applications_create on public.enrollment_applications for insert to authenticated with check(account_id=auth.uid() and status='pending');
create policy applications_review on public.enrollment_applications for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy modules_read on public.modules for select to authenticated using(public.enrolled(course_id) or public.teaches(course_id) or public.is_admin());
create policy modules_manage on public.modules for all to authenticated using(public.teaches(course_id) or public.is_admin()) with check(public.teaches(course_id) or public.is_admin());
create policy lessons_read on public.lessons for select to authenticated using(public.can_read_lesson(id));
create policy lessons_manage on public.lessons for all to authenticated using(public.teaches(course_id) or public.is_admin()) with check(public.teaches(course_id) or public.is_admin());
create policy prerequisites_read on public.lesson_prerequisites for select to authenticated using(public.can_read_lesson(lesson_id));
create policy progress_read on public.lesson_progress for select to authenticated using(account_id=auth.uid() or public.is_admin() or exists(select 1 from public.guardian_links g where g.guardian_id=auth.uid() and g.student_id=account_id and g.verified_at is not null));
create policy progress_write on public.lesson_progress for insert to authenticated with check(account_id=auth.uid() and public.can_read_lesson(lesson_id));
create policy assignments_read on public.assignments for select to authenticated using(public.can_read_lesson(lesson_id));
create policy assignments_manage on public.assignments for all to authenticated using(public.teaches(course_id) or public.is_admin()) with check(public.teaches(course_id) or public.is_admin());
create policy submissions_read on public.submissions for select to authenticated using(account_id=auth.uid() or public.is_admin() or exists(select 1 from public.assignments a where a.id=assignment_id and public.teaches(a.course_id)));
create policy submissions_create on public.submissions for insert to authenticated with check(account_id=auth.uid() and exists(select 1 from public.assignments a where a.id=assignment_id and public.can_read_lesson(a.lesson_id) and (a.due_at is null or a.due_at>now())));
create policy grades_read on public.grades for select to authenticated using(exists(select 1 from public.submissions s where s.id=submission_id));
create policy grades_manage on public.grades for all to authenticated using(public.is_admin() or exists(select 1 from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=submission_id and public.teaches(a.course_id))) with check(grader_id=auth.uid() and (public.is_admin() or exists(select 1 from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=submission_id and public.teaches(a.course_id))));
create policy sessions_read on public.live_sessions for select to authenticated using(public.enrolled(course_id) or public.teaches(course_id) or public.is_admin());
create policy sessions_manage on public.live_sessions for all to authenticated using(public.teaches(course_id) or public.is_admin()) with check(public.teaches(course_id) or public.is_admin());
create policy invites_read on public.live_session_invites for select to authenticated using(account_id=auth.uid() or public.is_admin());
create policy notes_private on public.user_notes for all to authenticated using(account_id=auth.uid()) with check(account_id=auth.uid() and (lesson_id is null or public.can_read_lesson(lesson_id)));
create policy notifications_read on public.notifications for select to authenticated using(account_id=auth.uid());
create policy notifications_update on public.notifications for update to authenticated using(account_id=auth.uid()) with check(account_id=auth.uid());
create policy documents_read on public.ai_knowledge_documents for select to authenticated using(public.enrolled(course_id) or public.teaches(course_id) or public.is_admin());
create policy documents_manage on public.ai_knowledge_documents for all to authenticated using(public.teaches(course_id) or public.is_admin()) with check(uploaded_by=auth.uid() and (public.teaches(course_id) or public.is_admin()));
create policy chunks_read on public.ai_document_chunks for select to authenticated using(exists(select 1 from public.ai_knowledge_documents d where d.id=document_id));
create policy conversations_private on public.ai_conversations for all to authenticated using(account_id=auth.uid() and public.enrolled(course_id)) with check(account_id=auth.uid() and public.enrolled(course_id));
create policy messages_read on public.ai_messages for select to authenticated using(exists(select 1 from public.ai_conversations c where c.id=conversation_id));
create policy speaking_private on public.speaking_sessions for all to authenticated using(account_id=auth.uid()) with check(account_id=auth.uid());
create policy consent_read on public.consent_records for select to authenticated using(account_id=auth.uid() or guardian_id=auth.uid() or public.is_admin());
create policy consent_create on public.consent_records for insert to authenticated with check(account_id=auth.uid() and guardian_id is null);
create policy certificates_private on public.certificates for select to authenticated using(account_id=auth.uid() or public.is_admin());
create policy audit_admin on public.audit_logs for select to authenticated using(public.is_admin());
create policy settings_super on public.application_settings for all to authenticated using(public.has_role('super_admin')) with check(public.has_role('super_admin'));
create index enrollments_account_idx on public.course_enrollments(account_id);
create index applications_status_idx on public.enrollment_applications(status,created_at);
create index lessons_course_idx on public.lessons(course_id,released_at);
create index sessions_time_idx on public.live_sessions(course_id,starts_at);
create index notifications_account_idx on public.notifications(account_id,created_at desc);
-- Internal trigger function must not be available as a public RPC.
revoke execute on function public.handle_new_user() from public,anon,authenticated;


-- SOURCE: 202610180002_workflows.sql

-- Bind duplicated course identifiers to their actual parent resources.
alter table public.modules add constraint modules_id_course_unique unique(id,course_id);
alter table public.lessons add constraint lessons_module_course_fk foreign key(module_id,course_id) references public.modules(id,course_id);
alter table public.lessons add constraint lessons_id_course_unique unique(id,course_id);
alter table public.assignments add constraint assignments_lesson_course_fk foreign key(lesson_id,course_id) references public.lessons(id,course_id);
create function public.approve_application(application_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare a public.enrollment_applications; cid uuid;
begin
 if not public.is_admin() then raise exception 'Forbidden' using errcode='42501';end if;
 select * into a from public.enrollment_applications where id=application_id for update;
 if not found then raise exception 'Application not found';end if;
 if a.status='approved' then return;end if;
 if a.status<>'pending' then raise exception 'Application is not pending';end if;
 select id into cid from public.courses where slug=a.course_slug;
 insert into public.course_enrollments(course_id,account_id) values(cid,a.account_id) on conflict(course_id,account_id) do nothing;
 update public.enrollment_applications set status='approved' where id=a.id;
 insert into public.notifications(account_id,event,body) values(a.account_id,'enrollment_approved','Your course application has been approved.');
 insert into public.audit_logs(actor_id,event,resource_id) values(auth.uid(),'enrollment.approved',a.id);
end;$$;
revoke all on function public.approve_application(uuid) from public,anon;
grant execute on function public.approve_application(uuid) to authenticated;
create policy programs_read on public.programs for select using(exists(select 1 from public.schools s where s.id=school_id));
create policy programs_manage on public.programs for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy chunks_manage on public.ai_document_chunks for all to authenticated using(exists(select 1 from public.ai_knowledge_documents d where d.id=document_id and (public.teaches(d.course_id) or public.is_admin()))) with check(exists(select 1 from public.ai_knowledge_documents d where d.id=document_id and (public.teaches(d.course_id) or public.is_admin())));
create policy prerequisites_manage on public.lesson_prerequisites for all to authenticated using(exists(select 1 from public.lessons l where l.id=lesson_id and (public.teaches(l.course_id) or public.is_admin()))) with check(exists(select 1 from public.lessons l where l.id=lesson_id and (public.teaches(l.course_id) or public.is_admin())));
create policy announcements_read on public.announcements for select to authenticated using(public.enrolled(course_id) or public.teaches(course_id) or public.is_admin());
create policy announcements_manage on public.announcements for all to authenticated using(public.teaches(course_id) or public.is_admin()) with check(public.teaches(course_id) or public.is_admin());
create policy invites_manage on public.live_session_invites for all to authenticated using(exists(select 1 from public.live_sessions s where s.id=session_id and (public.teaches(s.course_id) or public.is_admin()))) with check(exists(select 1 from public.live_sessions s where s.id=session_id and (public.teaches(s.course_id) or public.is_admin())));


-- SOURCE: 202610180003_ai_and_sessions.sql

alter table public.ai_knowledge_documents add column lesson_id uuid references public.lessons on delete cascade;
alter table public.ai_knowledge_documents add column published boolean not null default false;
drop policy documents_read on public.ai_knowledge_documents;
create policy documents_read on public.ai_knowledge_documents for select to authenticated using(public.is_admin() or public.teaches(course_id) or (public.enrolled(course_id) and published and (lesson_id is null or public.can_read_lesson(lesson_id))));
create function public.consume_ai_quota() returns boolean language plpgsql security definer set search_path='' as $$
declare used bigint;begin
 if auth.uid() is null then return false;end if;
 insert into public.usage_counters(account_id,period,kind,amount) values(auth.uid(),(now() at time zone 'UTC')::date,'ai_requests',1)
 on conflict(account_id,period,kind) do update set amount=public.usage_counters.amount+1 where public.usage_counters.amount<20 returning amount into used;
 return used is not null;
end;$$;
revoke all on function public.consume_ai_quota() from public,anon;
grant execute on function public.consume_ai_quota() to authenticated;
create function public.ingest_text_document(cid uuid,lid uuid,document_title text,chunks text[]) returns uuid language plpgsql security definer set search_path='' as $$
declare did uuid; i integer;begin
 if not (public.teaches(cid) or public.is_admin()) then raise exception 'Forbidden' using errcode='42501';end if;
 if lid is not null and not exists(select 1 from public.lessons where id=lid and course_id=cid) then raise exception 'Invalid lesson';end if;
 if array_length(chunks,1) is null or array_length(chunks,1)>100 or length(document_title)>200 then raise exception 'Invalid document';end if;
 insert into public.ai_knowledge_documents(course_id,lesson_id,title,uploaded_by,published) values(cid,lid,document_title,auth.uid(),true) returning id into did;
 for i in 1..array_length(chunks,1) loop
 if length(chunks[i])>2000 then raise exception 'Chunk too large';end if;
 insert into public.ai_document_chunks(document_id,content,position) values(did,chunks[i],i-1);
 end loop;
 insert into public.audit_logs(actor_id,event,resource_id) values(auth.uid(),'document.indexed',did);
 return did;
end;$$;
revoke all on function public.ingest_text_document(uuid,uuid,text,text[]) from public,anon;
grant execute on function public.ingest_text_document(uuid,uuid,text,text[]) to authenticated;
alter table public.live_sessions add column cancelled_at timestamptz;


-- SOURCE: 202610180004_recording.sql

create function public.recording_authorized(sid uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.live_sessions s where s.id=sid and s.recording_allowed and s.cancelled_at is null and s.starts_at-interval '15 minutes'<=now() and s.ends_at>now() and (public.is_admin() or public.teaches(s.course_id)) and not exists(select 1 from public.live_session_invites i where i.session_id=s.id and not exists(select 1 from public.consent_records c where c.account_id=i.account_id and c.kind='class_recording:'||s.id::text and c.granted and c.created_at=(select max(c2.created_at) from public.consent_records c2 where c2.account_id=c.account_id and c2.kind=c.kind))))
$$;
revoke all on function public.recording_authorized(uuid) from public,anon;
grant execute on function public.recording_authorized(uuid) to authenticated;


-- SOURCE: 202610180005_assessments.sql

create table public.assessments(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses,lesson_id uuid not null references public.lessons,title text not null,time_limit_seconds integer not null default 900 check(time_limit_seconds between 60 and 7200),attempt_limit integer not null default 3 check(attempt_limit between 1 and 20),passing_score numeric not null default 70 check(passing_score between 0 and 100),foreign key(lesson_id,course_id) references public.lessons(id,course_id));
create table public.assessment_questions(id uuid primary key default gen_random_uuid(),assessment_id uuid not null references public.assessments on delete cascade,kind text not null check(kind in ('multiple_choice','short_answer')),prompt text not null,options jsonb not null default '[]',correct_answer text not null,points numeric not null default 1 check(points>0),position integer not null,unique(assessment_id,position));
create table public.assessment_attempts(id uuid primary key default gen_random_uuid(),assessment_id uuid not null references public.assessments on delete cascade,account_id uuid not null references public.profiles on delete cascade,started_at timestamptz not null default now(),submitted_at timestamptz,answers jsonb,score numeric check(score between 0 and 100));
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_attempts enable row level security;
create policy assessments_read on public.assessments for select to authenticated using(public.can_read_lesson(lesson_id));
create policy assessments_manage on public.assessments for all to authenticated using(public.teaches(course_id) or public.is_admin()) with check(public.teaches(course_id) or public.is_admin());
create policy questions_staff on public.assessment_questions for all to authenticated using(exists(select 1 from public.assessments a where a.id=assessment_id and (public.teaches(a.course_id) or public.is_admin()))) with check(exists(select 1 from public.assessments a where a.id=assessment_id and (public.teaches(a.course_id) or public.is_admin())));
create policy attempts_read on public.assessment_attempts for select to authenticated using(account_id=auth.uid() or public.is_admin() or exists(select 1 from public.assessments a where a.id=assessment_id and public.teaches(a.course_id)));
create function public.start_assessment(aid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.assessments; attempt_id uuid; started timestamptz; questions jsonb;
begin
 select * into a from public.assessments where id=aid;
 if not found or not public.can_read_lesson(a.lesson_id) then raise exception 'Forbidden' using errcode='42501';end if;
 -- Serialize concurrent starts for a single account and assessment.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||aid::text,0));
 select id,started_at into attempt_id,started from public.assessment_attempts where assessment_id=aid and account_id=auth.uid() and submitted_at is null order by started_at desc limit 1;
 if attempt_id is null then
 if (select count(*) from public.assessment_attempts where assessment_id=aid and account_id=auth.uid())>=a.attempt_limit then raise exception 'Attempt limit reached';end if;
 insert into public.assessment_attempts(assessment_id,account_id) values(aid,auth.uid()) returning id,started_at into attempt_id,started;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'kind',q.kind,'prompt',q.prompt,'options',q.options) order by q.position),'[]') into questions from public.assessment_questions q where q.assessment_id=aid;
 return jsonb_build_object('attemptId',attempt_id,'deadline',started+make_interval(secs=>a.time_limit_seconds),'questions',questions);
end;$$;
create function public.submit_assessment(attempt_id uuid,responses jsonb) returns numeric language plpgsql security definer set search_path='' as $$
declare attempt public.assessment_attempts; a public.assessments; earned numeric; total numeric; computed numeric;
begin
 select * into attempt from public.assessment_attempts where id=attempt_id and account_id=auth.uid() for update;
 if not found then raise exception 'Forbidden' using errcode='42501';end if;
 if attempt.submitted_at is not null then return attempt.score;end if;
 select * into a from public.assessments where id=attempt.assessment_id;
 if not public.can_read_lesson(a.lesson_id) then raise exception 'Forbidden' using errcode='42501';end if;
 if jsonb_typeof(responses)<>'object' or octet_length(responses::text)>20000 then raise exception 'Invalid answers';end if;
 if now()>attempt.started_at+make_interval(secs=>a.time_limit_seconds) then computed=0;
 else
 select coalesce(sum(q.points),0),coalesce(sum(case when lower(trim(responses->>q.id::text))=lower(trim(q.correct_answer)) then q.points else 0 end),0) into total,earned from public.assessment_questions q where q.assessment_id=a.id;
 computed=case when total>0 then round(100*earned/total,2) else 0 end;
 end if;
 update public.assessment_attempts set answers=responses,submitted_at=now(),score=computed where id=attempt.id;
 return computed;
end;$$;
create function public.complete_lesson(lid uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.can_read_lesson(lid) then raise exception 'Forbidden' using errcode='42501';end if;
 if exists(select 1 from public.assessments a where a.lesson_id=lid and not exists(select 1 from public.assessment_attempts t where t.assessment_id=a.id and t.account_id=auth.uid() and t.submitted_at is not null and t.score>=a.passing_score)) then raise exception 'Pass the lesson assessments first';end if;
 insert into public.lesson_progress(account_id,lesson_id) values(auth.uid(),lid) on conflict do nothing;
end;$$;
-- Completion is written only through the enforced completion function.
drop policy progress_write on public.lesson_progress;
revoke all on function public.start_assessment(uuid),public.submit_assessment(uuid,jsonb),public.complete_lesson(uuid) from public,anon;
grant execute on function public.start_assessment(uuid),public.submit_assessment(uuid,jsonb),public.complete_lesson(uuid) to authenticated;
create index assessment_attempts_student_idx on public.assessment_attempts(account_id,assessment_id);


grant usage on schema public to anon, authenticated;
grant select on public.schools, public.programs, public.courses to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
-- RLS policies restrict which rows each signed-in user can access.


-- Curriculum fixtures only. No real people or fabricated achievements.
insert into public.schools(name,slug,published) values
('Kids English','kids',true),('School English','school',true),('General English','general',true),('Business English','business',true),('Academic English','academic',true),('English for IT and Engineering','tech',true),('IELTS and TOEFL','exams',true),('Conversational English','conversation',true),('Job Interviews','interviews',true),('Research and University','research',true) on conflict(slug) do nothing;
insert into public.courses(school_id,slug,title,level,description,published)
select s.id,v.slug,v.title,v.level,v.description,true from (values
('general','everyday-english','English for everyday life','A2','Everyday conversations, useful phrases, and clear messages.'),
('business','business-english','Make yourself heard at work','B1','Professional communication for meetings and presentations.'),
('conversation','conversation','Less overthinking. More speaking.','B1','Build fluency through purposeful conversation.'),
('kids','young-explorers','Big discoveries for little learners','A1','Age-appropriate stories and everyday vocabulary.'),
('exams','ielts','Your next chapter starts here','B2','Structured preparation for academic English examinations.'),
('tech','english-for-tech','Connect beyond the code','B1','Technical communication and collaboration.')
) as v(school,slug,title,level,description) join public.schools s on s.slug=v.school on conflict(slug) do nothing;
insert into public.modules(course_id,title,position) select id,'Your first conversations',0 from public.courses where slug='everyday-english' on conflict(course_id,position) do nothing;
insert into public.lessons(module_id,course_id,title,body,position,released_at) select m.id,m.course_id,'Hello, world: introducing yourself','A simple introduction can open a conversation. Say: Hello, my name is ___. I am from ___. It is nice to meet you. Ask a follow-up question: What do you like to do in your free time? Practice writing your own introduction, then read it out loud.',0,now() from public.modules m join public.courses c on c.id=m.course_id where c.slug='everyday-english' on conflict(module_id,position) do nothing;

insert into public.assessments(id,course_id,lesson_id,title) select '10000000-0000-0000-0000-000000000001',l.course_id,l.id,'A confident first hello' from public.lessons l join public.courses c on c.id=l.course_id where c.slug='everyday-english' and l.position=0 on conflict(id) do nothing;
insert into public.assessment_questions(assessment_id,kind,prompt,options,correct_answer,position) values('10000000-0000-0000-0000-000000000001','multiple_choice','Which sentence introduces you?','["Hello, my name is Alex.","Where is the station?","It is raining."]','Hello, my name is Alex.',0) on conflict(assessment_id,position) do nothing;


notify pgrst, 'reload schema';
commit;