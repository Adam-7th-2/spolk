begin;
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
commit;
