begin;
create function public.recording_authorized(sid uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.live_sessions s where s.id=sid and s.recording_allowed and s.cancelled_at is null and s.starts_at-interval '15 minutes'<=now() and s.ends_at>now() and (public.is_admin() or public.teaches(s.course_id)) and not exists(select 1 from public.live_session_invites i where i.session_id=s.id and not exists(select 1 from public.consent_records c where c.account_id=i.account_id and c.kind='class_recording:'||s.id::text and c.granted and c.created_at=(select max(c2.created_at) from public.consent_records c2 where c2.account_id=c.account_id and c2.kind=c.kind))))
$$;
revoke all on function public.recording_authorized(uuid) from public,anon;
grant execute on function public.recording_authorized(uuid) to authenticated;
commit;
