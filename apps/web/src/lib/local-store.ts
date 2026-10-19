import {PGlite,type Transaction} from "@electric-sql/pglite";
import {readFile,readdir,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from "node:crypto";

export const demoAccounts=[
 {id:"e2000000-0000-4000-8000-000000000001",email:"student@spolk.local",role:"student"},
 {id:"e2000000-0000-4000-8000-000000000002",email:"teacher@spolk.local",role:"teacher"},
 {id:"e2000000-0000-4000-8000-000000000003",email:"admin@spolk.local",role:"admin"},
];
export const demoPassword="SpolkLocal2026!";
type Account={id:string;email:string;password_hash:string;salt:string};
const hash=(password:string,salt:string)=>scryptSync(password,salt,64).toString("hex");
const digest=(token:string)=>createHash("sha256").update(token).digest("hex");

export async function openLocalStore(directory:string,root:string){
 if(directory!=="memory://")await mkdir(directory,{recursive:true});
 const db=new PGlite(directory);
 await db.waitReady;
 const exists=(await db.query<{table_name:string|null}>("select to_regclass('auth.local_accounts')::text as table_name")).rows[0].table_name;
 if(!exists)await db.transaction(async tx=>{
  await tx.exec(`create role anon;create role authenticated;create schema auth;
   create table auth.users(id uuid primary key,email text unique not null);
   create table auth.local_accounts(id uuid primary key references auth.users on delete cascade,email text unique not null,password_hash text not null,salt text not null);
   create table auth.local_sessions(token_hash text primary key,account_id uuid not null references auth.users on delete cascade,expires_at timestamptz not null);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  const migrationDir=resolve(root,"supabase/migrations");
  for(const name of (await readdir(migrationDir)).filter(n=>n.endsWith(".sql")).sort()){
   const sql=(await readFile(resolve(migrationDir,name),"utf8")).replace(/create extension if not exists (vector|pgcrypto);/g,"").replace(/vector\(768\)/g,"double precision[]").replace(/^\s*(begin|commit);\s*$/gmi,"");
   await tx.exec(sql);
  }
  await tx.exec(await readFile(resolve(root,"supabase/seed.sql"),"utf8"));
  await tx.exec("grant usage on schema public to anon,authenticated;grant select on public.schools,public.programs,public.courses to anon;grant select,insert,update,delete on all tables in schema public to authenticated;");
  for(const account of demoAccounts){
   const salt=randomBytes(16).toString("hex");
   await tx.query("insert into auth.users values($1,$2)",[account.id,account.email]);
   await tx.query("insert into auth.local_accounts values($1,$2,$3,$4)",[account.id,account.email,hash(demoPassword,salt),salt]);
   if(account.role!=="student")await tx.query("insert into public.user_roles values($1,$2)",[account.id,account.role]);
  }
  const demo=(await readFile(resolve(root,"supabase/DEMO_SETUP.sql"),"utf8")).replaceAll("henok.tarikuu@astu.edu.et","student@spolk.local").replace("teacher_email text := null","teacher_email text := 'teacher@spolk.local'").replace(/^\s*(begin|commit);\s*$/gmi,"");
  await tx.exec(demo);
  const manifest=JSON.parse(await readFile(resolve(root,"apps/web/src/content/traveller.json"),"utf8"));
  const exams=JSON.parse(await readFile(resolve(root,"apps/web/src/content/traveller-exams.json"),"utf8"));
  await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[demoAccounts[2].id]);
  await tx.query("select public.install_traveller_course($1::jsonb,$2,current_date,false,false)",[JSON.stringify(manifest),demoAccounts[0].email]);
  await tx.query("select public.install_traveller_exams($1::jsonb,current_date)",[JSON.stringify(exams)]);
  await tx.exec("insert into public.course_instructors(course_id,account_id) select course_id,'e2000000-0000-4000-8000-000000000002' from public.book_sources where id='traveller-beginners' on conflict do nothing;");
 });
 // Idempotent workflow upgrade for databases created before the card-based quiz.
 await db.transaction(async tx=>{await tx.exec(await readFile(resolve(root,"supabase/migrations/202610190001_assessment_cards.sql"),"utf8"));});
 await db.transaction(async tx=>{await tx.exec(await readFile(resolve(root,"supabase/migrations/202610190002_student_workspace.sql"),"utf8"));});
 return {
  db,
  async actor<T>(id:string|null,run:(tx:Transaction)=>Promise<T>){return db.transaction(async tx=>{
   await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id||""]);
   await tx.exec(id?"set local role authenticated":"set local role anon");
   return run(tx);
  });},
  async user(token?:string){
   if(!token)return null;
   const {rows}=await db.query<{id:string;email:string}>("select u.id,u.email from auth.local_sessions s join auth.users u on u.id=s.account_id where s.token_hash=$1 and s.expires_at>now()",[digest(token)]);
   return rows[0]||null;
  },
  async login(email:string,password:string){
   const {rows}=await db.query<Account>("select * from auth.local_accounts where email=$1",[email.trim().toLowerCase()]);
   const account=rows[0];
   const supplied=Buffer.from(hash(password,account?.salt||"missing-local-account"),"hex");
   const expected=account?Buffer.from(account.password_hash,"hex"):Buffer.alloc(64);
   if(!timingSafeEqual(supplied,expected)||!account)return null;
   const token=randomBytes(32).toString("hex");
   await db.query("insert into auth.local_sessions values($1,$2,now()+interval '7 days')",[digest(token),account.id]);
   return {token,user:{id:account.id,email:account.email}};
  },
  async signup(email:string,password:string){
   const id=randomUUID(),salt=randomBytes(16).toString("hex");
   await db.transaction(async tx=>{await tx.query("insert into auth.users values($1,$2)",[id,email.trim().toLowerCase()]);await tx.query("insert into auth.local_accounts values($1,$2,$3,$4)",[id,email.trim().toLowerCase(),hash(password,salt),salt]);});
   return {id,email:email.trim().toLowerCase()};
  },
  async logout(token:string){await db.query("delete from auth.local_sessions where token_hash=$1",[digest(token)]);},
  async changePassword(id:string,password:string){
   const salt=randomBytes(16).toString("hex");
   await db.transaction(async tx=>{await tx.query("update auth.local_accounts set password_hash=$1,salt=$2 where id=$3",[hash(password,salt),salt,id]);await tx.query("delete from auth.local_sessions where account_id=$1",[id]);});
  },
 };
}

type Store=Awaited<ReturnType<typeof openLocalStore>>;
const globals=globalThis as typeof globalThis&{spolkLocalStore?:Promise<Store>};
export function localStore(){
 const root=resolve(process.cwd(),"../../");
 return globals.spolkLocalStore??=openLocalStore(resolve(root,".tools/local-academy"),root).catch(error=>{delete globals.spolkLocalStore;throw error;});
}
