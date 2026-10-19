-- Private object storage for hosts without persistent disks. No public/authenticated
-- object policies are added: the server authorizes downloads before using its secret key.
do $$begin
 if to_regclass('storage.buckets') is not null then
  insert into storage.buckets(id,name,public,file_size_limit)
  values('spolk-private-uploads','spolk-private-uploads',false,52428800)
  on conflict(id) do update set public=false,file_size_limit=52428800;
 end if;
end$$;
