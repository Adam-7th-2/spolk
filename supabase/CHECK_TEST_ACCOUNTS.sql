-- Read-only: verify the exact administrator and student accounts.
select u.email,
       u.email_confirmed_at is not null as email_confirmed,
       coalesce(array_agg(r.role::text order by r.role) filter(where r.role is not null), '{}') as academy_roles,
       bool_or(r.role in ('admin','super_admin')) as can_open_admin,
       bool_or(r.role = 'student') as has_student_role
from auth.users u
left join public.user_roles r on r.account_id=u.id
where lower(u.email) in ('koslog.team@gmail.com','henok.tarikuu@astu.edu.et')
group by u.id,u.email,u.email_confirmed_at
order by lower(u.email);

-- Expected result:
-- koslog.team@gmail.com        ... {admin} ... true  ... false
-- henok.tarikuu@astu.edu.et    ... {student} ... false ... true
