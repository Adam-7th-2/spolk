begin;
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
commit;
