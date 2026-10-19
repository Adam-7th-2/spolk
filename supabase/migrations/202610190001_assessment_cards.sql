-- Commit each practice answer before returning feedback. Saved answers cannot be edited.
create or replace function public.answer_assessment_question(attempt_id uuid,question_id uuid,response text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.assessment_attempts; a public.assessments; q public.assessment_questions; saved text;
begin
 select * into t from public.assessment_attempts where id=attempt_id and account_id=auth.uid() for update;
 if not found then raise exception 'Forbidden' using errcode='42501';end if;
 select * into a from public.assessments where id=t.assessment_id;
 if not public.can_read_lesson(a.lesson_id) then raise exception 'Forbidden' using errcode='42501';end if;
 if t.submitted_at is not null then raise exception 'Attempt already submitted';end if;
 if now()>=t.started_at+make_interval(secs=>a.time_limit_seconds) then raise exception 'Assessment time has expired';end if;
 select * into q from public.assessment_questions where id=question_id and assessment_id=t.assessment_id;
 if not found then raise exception 'Invalid question';end if;
 if response is null or length(trim(response))=0 or length(response)>1000 then raise exception 'Invalid answer';end if;
 if q.kind='multiple_choice' and not(q.options ? response) then raise exception 'Invalid option';end if;
 saved=t.answers->>q.id::text;
 if saved is null then
  saved=response;
  update public.assessment_attempts set answers=coalesce(answers,'{}'::jsonb)||jsonb_build_object(q.id::text,response) where id=t.id;
 end if;
 return jsonb_build_object('id',q.id,'prompt',q.prompt,'selected',saved,'correctAnswer',q.correct_answer,'correct',lower(trim(saved))=lower(trim(q.correct_answer)));
end;$$;

create or replace function public.assessment_practice_review(attempt_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.assessment_attempts; a public.assessments; feedback jsonb;
begin
 select * into t from public.assessment_attempts where id=attempt_id and account_id=auth.uid();
 if not found then raise exception 'Forbidden' using errcode='42501';end if;
 select * into a from public.assessments where id=t.assessment_id;
 if not public.can_read_lesson(a.lesson_id) then raise exception 'Forbidden' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'prompt',q.prompt,'selected',t.answers->>q.id::text,'correctAnswer',q.correct_answer,'correct',coalesce(lower(trim(t.answers->>q.id::text))=lower(trim(q.correct_answer)),false)) order by q.position),'[]'::jsonb)
 into feedback from public.assessment_questions q where q.assessment_id=t.assessment_id and (t.submitted_at is not null or t.answers ? q.id::text);
 return jsonb_build_object('answers',feedback,'score',t.score,'submittedAt',t.submitted_at,'expired',now()>t.started_at+make_interval(secs=>a.time_limit_seconds));
end;$$;

create or replace function public.submit_assessment(attempt_id uuid,responses jsonb)
returns numeric language plpgsql security definer set search_path='' as $$
declare attempt public.assessment_attempts; a public.assessments; earned numeric; total numeric; computed numeric; final_answers jsonb;
begin
 select * into attempt from public.assessment_attempts where id=attempt_id and account_id=auth.uid() for update;
 if not found then raise exception 'Forbidden' using errcode='42501';end if;
 if attempt.submitted_at is not null then return attempt.score;end if;
 select * into a from public.assessments where id=attempt.assessment_id;
 if not public.can_read_lesson(a.lesson_id) then raise exception 'Forbidden' using errcode='42501';end if;
 if responses is null or jsonb_typeof(responses)<>'object' or octet_length(responses::text)>20000 then raise exception 'Invalid answers';end if;
 -- The right-hand object wins: answers checked for feedback stay frozen.
 final_answers=responses||coalesce(attempt.answers,'{}'::jsonb);
 if now()>attempt.started_at+make_interval(secs=>a.time_limit_seconds) then computed=0;
 else
  select coalesce(sum(q.points),0),coalesce(sum(case when lower(trim(final_answers->>q.id::text))=lower(trim(q.correct_answer)) then q.points else 0 end),0)
  into total,earned from public.assessment_questions q where q.assessment_id=a.id;
  computed=case when total>0 then round(100*earned/total,2) else 0 end;
 end if;
 update public.assessment_attempts set answers=final_answers,submitted_at=now(),score=computed where id=attempt.id;
 return computed;
end;$$;
revoke all on function public.answer_assessment_question(uuid,uuid,text),public.assessment_practice_review(uuid) from public,anon;
grant execute on function public.answer_assessment_question(uuid,uuid,text),public.assessment_practice_review(uuid) to authenticated;
notify pgrst,'reload schema';
