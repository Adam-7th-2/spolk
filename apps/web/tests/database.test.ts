import {PGlite} from "@electric-sql/pglite";
import {beforeAll,afterAll,describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
let db:PGlite;
const ids={student:"00000000-0000-0000-0000-000000000001",other:"00000000-0000-0000-0000-000000000002",teacher:"00000000-0000-0000-0000-000000000003",admin:"00000000-0000-0000-0000-000000000004",guardian:"00000000-0000-0000-0000-000000000005"};
let course:string,otherCourse:string,lesson:string;
async function actor(id:string){await db.exec("reset role");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec("set role authenticated");}
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
 // Embedded PostgreSQL tests use a plain array instead of the unavailable pgvector extension.
 // RLS, triggers, constraints and transactional functions run unchanged.
 for(const name of ["202610180001_foundation.sql","202610180002_workflows.sql","202610180003_ai_and_sessions.sql","202610180004_recording.sql","202610180005_assessments.sql"]){const sql=readFileSync(resolve("../../supabase/migrations",name),"utf8").replace("create extension if not exists vector;","").replace("create extension if not exists pgcrypto;","").replace("vector(768)","double precision[]");await db.exec(sql);}
 await db.exec(readFileSync(resolve("../../supabase/seed.sql"),"utf8"));
 await db.exec("grant usage on schema public to authenticated,anon;grant select,insert,update,delete on all tables in schema public to authenticated;grant select on all tables in schema public to anon;");
 for(const id of Object.values(ids))await db.query("insert into auth.users(id) values($1)",[id]);
 await db.query("insert into public.user_roles values($1,'teacher'),($2,'admin'),($3,'guardian')",[ids.teacher,ids.admin,ids.guardian]);
 course=(await db.query<{id:string}>("select id from public.courses where slug='everyday-english'")).rows[0].id;
 otherCourse=(await db.query<{id:string}>("select id from public.courses where slug='business-english'")).rows[0].id;
 lesson=(await db.query<{id:string}>("select id from public.lessons limit 1")).rows[0].id;
 await db.query("insert into public.course_enrollments(course_id,account_id) values($1,$2)",[course,ids.student]);
 await db.query("insert into public.course_instructors values($1,$2)",[otherCourse,ids.teacher]);
 await db.query("insert into public.guardian_links values($1,$2,now())",[ids.guardian,ids.student]);
},30000);
afterAll(async()=>{await db?.close()});
describe("PostgreSQL row level security",()=>{
it("does not expose assessment answer keys to students",async()=>{await actor(ids.student);expect((await db.query("select correct_answer from public.assessment_questions")).rows).toHaveLength(0);});
it("returns answer-free questions and grades exactly once",async()=>{await actor(ids.student);const start=await db.query<{result:{attemptId:string;questions:{id:string}[]}}>("select public.start_assessment('10000000-0000-0000-0000-000000000001') as result");const data=start.rows[0].result;expect(JSON.stringify(data)).not.toContain("correct_answer");const answer={[data.questions[0].id]:"Hello, my name is Alex."};expect((await db.query<{score:string}>("select public.submit_assessment($1,$2::jsonb) as score",[data.attemptId,JSON.stringify(answer)])).rows[0].score).toBe("100.00");expect((await db.query<{score:string}>("select public.submit_assessment($1,'{}'::jsonb) as score",[data.attemptId])).rows[0].score).toBe("100.00");});
it("persists student AI quotas without allowing more than twenty uses",async()=>{await actor(ids.student);for(let i=0;i<20;i++)expect((await db.query<{ok:boolean}>("select public.consume_ai_quota() as ok")).rows[0].ok).toBe(true);expect((await db.query<{ok:boolean}>("select public.consume_ai_quota() as ok")).rows[0].ok).toBe(false);});

it("creates student roles through the auth trigger",async()=>{await actor(ids.student);expect((await db.query("select role from public.user_roles")).rows).toEqual([{role:"student"}]);});
it("prevents self-escalation",async()=>{await actor(ids.student);await expect(db.query("insert into public.user_roles values($1,'admin')",[ids.student])).rejects.toThrow();});
it("isolates another studentâ€™s profile and enrollment",async()=>{await actor(ids.other);expect((await db.query("select * from public.course_enrollments")).rows).toHaveLength(0);expect((await db.query("select id from public.profiles")).rows).toEqual([{id:ids.other}]);});
it("denies unassigned teachers access to enrolled students",async()=>{await actor(ids.teacher);expect((await db.query("select * from public.course_enrollments")).rows).toHaveLength(0);expect((await db.query("select * from public.lessons")).rows).toHaveLength(0);});
it("permits released lessons to enrolled students",async()=>{await actor(ids.student);expect((await db.query("select id from public.lessons")).rows).toHaveLength(1);});
it("hides locked lesson bodies from direct queries",async()=>{await db.exec("reset role");await db.query("update public.lessons set released_at=now()+interval '1 day' where id=$1",[lesson]);await actor(ids.student);expect((await db.query("select body from public.lessons where id=$1",[lesson])).rows).toHaveLength(0);await db.exec("reset role");await db.query("update public.lessons set released_at=now()-interval '1 day' where id=$1",[lesson]);});
it("isolates private notes",async()=>{await actor(ids.student);await db.query("insert into public.user_notes(account_id,lesson_id,body) values($1,$2,'Private thought')",[ids.student,lesson]);await actor(ids.other);expect((await db.query("select * from public.user_notes")).rows).toHaveLength(0);});
it("permits verified guardian enrollment summaries",async()=>{await actor(ids.guardian);expect((await db.query("select account_id from public.course_enrollments")).rows).toEqual([{account_id:ids.student}]);});
it("denies student access to the approval RPC",async()=>{await actor(ids.student);await expect(db.query("select public.approve_application(gen_random_uuid())")).rejects.toThrow(/Forbidden/);});
it("approves idempotently and emits one notification",async()=>{await actor(ids.other);const app=await db.query<{id:string}>("insert into public.enrollment_applications(account_id,course_slug,goal,level,explanation_language) values($1,'everyday-english','Improve everyday conversation','A1','en') returning id",[ids.other]);await actor(ids.admin);await db.query("select public.approve_application($1)",[app.rows[0].id]);await db.query("select public.approve_application($1)",[app.rows[0].id]);await db.exec("reset role");expect((await db.query("select * from public.notifications where account_id=$1",[ids.other])).rows).toHaveLength(1);expect((await db.query("select * from public.course_enrollments where account_id=$1",[ids.other])).rows).toHaveLength(1);});
it("rejects student-created approved applications",async()=>{await actor(ids.student);await expect(db.query("insert into public.enrollment_applications(account_id,course_slug,goal,level,explanation_language,status) values($1,'business-english','Improve business communication','B1','en','approved')",[ids.student])).rejects.toThrow();});
it("denies reading unauthorized AI chunks",async()=>{await db.exec("reset role");const d=await db.query<{id:string}>("insert into public.ai_knowledge_documents(course_id,title,uploaded_by) values($1,'Private source',$2) returning id",[otherCourse,ids.teacher]);await db.query("insert into public.ai_document_chunks(document_id,content,position) values($1,'Secret business material',0)",[d.rows[0].id]);await actor(ids.student);expect((await db.query("select content from public.ai_document_chunks")).rows).toHaveLength(0);});
});

