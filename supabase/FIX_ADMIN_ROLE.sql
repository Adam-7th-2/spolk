-- Keep the Gmail account as an administrator only.
-- Run this after CHECK_TEST_ACCOUNTS.sql confirms the exact email.
begin;
do $$
declare target_id uuid;
begin
  select id into target_id
  from auth.users
  where lower(email) = 'koslog.team@gmail.com';
  if target_id is null then
    raise exception 'Account koslog.team@gmail.com was not found in Authentication > Users.';
  end if;
  insert into public.profiles(id) values(target_id) on conflict(id) do nothing;
  insert into public.user_roles(account_id, role)
  values(target_id, 'admin') on conflict(account_id, role) do nothing;
  delete from public.user_roles
  where account_id = target_id and role in ('student','teacher');
  insert into public.audit_logs(actor_id, event, resource_id)
  values(null, 'admin.roles_cleaned_via_sql_editor', target_id);
end;
$$;
commit;

select u.email, array_agg(r.role::text order by r.role) as academy_roles
from auth.users u
join public.user_roles r on r.account_id = u.id
where lower(u.email) = 'koslog.team@gmail.com'
group by u.email;
