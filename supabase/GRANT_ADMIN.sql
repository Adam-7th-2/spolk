-- Run in Supabase SQL Editor after creating this account in Authentication > Users.
-- This script grants academy administrator access; it does not set passwords.
begin;
do $$
declare target_id uuid;
begin
  select id into target_id from auth.users
  where lower(email) = 'koslog.team@gmail.com';
  if target_id is null then
    raise exception 'Create koslog.team@gmail.com in Authentication > Users first, then rerun this script.';
  end if;
  insert into public.profiles(id) values(target_id) on conflict(id) do nothing;
  insert into public.user_roles(account_id, role)
  values(target_id, 'admin') on conflict(account_id, role) do nothing;
  insert into public.audit_logs(actor_id, event, resource_id)
  values(null, 'admin.granted_via_sql_editor', target_id);
end;
$$;
commit;
select u.email, r.role
from auth.users u join public.user_roles r on r.account_id=u.id
where lower(u.email)='koslog.team@gmail.com' and r.role='admin';
