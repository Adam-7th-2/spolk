-- Automatic dashboard attendance. UTC dates are assigned by the database.
begin;
create table if not exists public.daily_checkins (
 account_id uuid not null references public.profiles on delete cascade,
 activity_date date not null default (now() at time zone 'UTC')::date,
 created_at timestamptz not null default now(),
 primary key(account_id,activity_date)
);
alter table public.daily_checkins enable row level security;
drop policy if exists checkins_read on public.daily_checkins;
create policy checkins_read on public.daily_checkins for select to authenticated
 using(account_id=auth.uid() or public.is_admin());
grant select on public.daily_checkins to authenticated;
revoke insert,update,delete on public.daily_checkins from anon,authenticated;
create index if not exists checkins_recent on public.daily_checkins(created_at desc);

create or replace function public.daily_checkin() returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); today date:=(now() at time zone 'UTC')::date;
 added int; current_days int; best_days int; recent jsonb; learner text;
begin
 if uid is null then raise exception 'Sign in first' using errcode='42501'; end if;
 insert into public.daily_checkins(account_id,activity_date) values(uid,today) on conflict do nothing;
 get diagnostics added=row_count;
 with numbered as (
  select activity_date,activity_date-(row_number() over(order by activity_date))::int as island
  from public.daily_checkins where account_id=uid
 ), runs as (select count(*)::int as days,max(activity_date) as last_day from numbered group by island)
 select coalesce(max(days) filter(where last_day=today),0),coalesce(max(days),0)
 into current_days,best_days from runs;
 select coalesce(jsonb_agg(activity_date order by activity_date),'[]') into recent
 from public.daily_checkins where account_id=uid and activity_date between today-6 and today;
 if added=1 then
  select display_name into learner from public.profiles where id=uid;
  insert into public.notifications(account_id,event,body,href)
  select distinct account_id,'daily_checkin',coalesce(learner,'Learner')||' checked in today. Daily streak: '||current_days||'.','/admin'
  from public.user_roles where role in ('admin','super_admin') and account_id<>uid;
 end if;
 return jsonb_build_object('current',current_days,'longest',best_days,'today',today,'days',recent);
end;$$;
revoke all on function public.daily_checkin() from public,anon;
grant execute on function public.daily_checkin() to authenticated;
notify pgrst,'reload schema';
commit;
