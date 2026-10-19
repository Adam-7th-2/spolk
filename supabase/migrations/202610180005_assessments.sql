begin;
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
commit;
