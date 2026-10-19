-- Save only learner profile fields from signup metadata; roles stay server-assigned.
begin;
create or replace function public.save_signup_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare p jsonb:=coalesce(to_jsonb(new)->'raw_user_meta_data','{}'::jsonb); zone text;
begin
 zone:=p->>'timezone';
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=zone) then zone:='UTC';end if;
 update public.profiles set
 first_name=left(trim(coalesce(p->>'first_name','')),80),
 last_name=left(trim(coalesce(p->>'last_name','')),80),
 display_name=coalesce(nullif(left(trim(concat_ws(' ',trim(p->>'first_name'),trim(p->>'last_name'))),100),''),'Learner'),
 country=left(trim(coalesce(p->>'country','')),100),city=left(trim(coalesce(p->>'city','')),100),timezone=zone,
 english_level=case when p->>'english_level' in ('A1','A2','B1','B2','C1','C2') then p->>'english_level' else 'Not sure' end,
 learning_goal=left(trim(coalesce(p->>'learning_goal','')),2000),
 explanation_language=case when p->>'explanation_language' in ('en','ru','am') then p->>'explanation_language' else 'en' end,
 interface_language=case when p->>'interface_language' in ('en','ru','am') then p->>'interface_language' else 'en' end,
 email_notifications=coalesce(p->>'email_notifications','false')='true'
 where id=new.id;
 return new;
end;$$;
-- Trigger names run alphabetically, after create_academy_profile.
drop trigger if exists save_academy_signup_profile on auth.users;
create trigger save_academy_signup_profile after insert on auth.users for each row execute function public.save_signup_profile();
revoke all on function public.save_signup_profile() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
