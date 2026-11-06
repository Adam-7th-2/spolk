-- Google sign-in stores full_name, not the first and last name fields used by email signup.
begin;
create or replace function public.save_signup_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare p jsonb:=coalesce(to_jsonb(new)->'raw_user_meta_data','{}'::jsonb); zone text; given text; family text; full_name text;
begin
 zone:=p->>'timezone';
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=zone) then zone:='UTC';end if;
 given:=left(trim(coalesce(nullif(p->>'first_name',''),nullif(p->>'given_name',''),'')),80);
 family:=left(trim(coalesce(nullif(p->>'last_name',''),nullif(p->>'family_name',''),'')),80);
 full_name:=left(trim(coalesce(nullif(p->>'full_name',''),nullif(p->>'name',''),'')),100);
 if given='' and full_name<>'' then
  given:=left(split_part(full_name,' ',1),80);
  family:=left(trim(substr(full_name,length(given)+1)),80);
 end if;
 update public.profiles set
 first_name=given,
 last_name=family,
 display_name=coalesce(nullif(left(trim(concat_ws(' ',nullif(given,''),nullif(family,''))),100),''),nullif(full_name,''),'Learner'),
 country=left(trim(coalesce(p->>'country','')),100),city=left(trim(coalesce(p->>'city','')),100),timezone=zone,
 english_level=case when p->>'english_level' in ('A1','A2','B1','B2','C1','C2') then p->>'english_level' else 'Not sure' end,
 learning_goal=left(trim(coalesce(p->>'learning_goal','')),2000),
 explanation_language=case when p->>'explanation_language' in ('en','ru','am') then p->>'explanation_language' else 'en' end,
 interface_language=case when p->>'interface_language' in ('en','ru','am') then p->>'interface_language' else 'en' end,
 email_notifications=coalesce(p->>'email_notifications','false')='true'
 where id=new.id;
 return new;
end;$$;
revoke all on function public.save_signup_profile() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
