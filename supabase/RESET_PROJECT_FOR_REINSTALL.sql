-- DESTRUCTIVE: reset the Spolk Supabase database for a clean reinstall.
-- This removes all public application data and all Authentication users.
-- It does not delete the Supabase project or any local files.
begin;

do $$
declare item record;
begin
  -- Tables and views created by the application, including RLS policies.
  for item in
    select tablename as object_name, 'table' as object_kind
    from pg_tables t
    where schemaname = 'public'
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_class'::regclass
          and d.objid = (quote_ident('public') || '.' || quote_ident(t.tablename))::regclass
          and d.deptype = 'e'
      )
    union all
    select viewname, 'view'
    from pg_views where schemaname = 'public'
  loop
    execute format('drop %s if exists public.%I cascade', item.object_kind, item.object_name);
  end loop;

  -- Application functions and procedures.
  for item in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'
      )
  loop
    execute format('drop function if exists %s cascade', item.signature);
  end loop;

  -- Application enum and custom types.
  for item in
    select t.typname as type_name
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typtype in ('e','c','d')
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_type'::regclass and d.objid = t.oid and d.deptype = 'e'
      )
  loop
    execute format('drop type if exists public.%I cascade', item.type_name);
  end loop;
end;
$$;

-- Remove accounts after dependent public tables have been dropped.
delete from auth.users;

commit;

-- After this finishes, run:
-- 1. supabase/SETUP_ONCE.sql
-- 2. supabase/TRAVELLER_SETUP.sql
-- 3. supabase/TRAVELLER_EXAMS_SETUP.sql
-- 4. Create the admin and student accounts in Authentication > Users
-- 5. Run supabase/GRANT_ADMIN.sql
