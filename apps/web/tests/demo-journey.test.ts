import {it,expect} from "vitest";
import {PGlite} from "@electric-sql/pglite";
import {readFileSync,readdirSync} from "node:fs";
import {resolve} from "node:path";
import {completeEarlierLessons} from './helpers/progression';
it("runs the sample student-to-teacher journey with real PostgreSQL policies",async()=>{
 const db=new PGlite();const student="e1000000-0000-4000-8000-000000000001",teacher="e1000000-0000-4000-8000-000000000002",outsider="e1000000-0000-4000-8000-000000000003";
 const first="d1000000-0000-4000-8000-000000000002",next="d1000000-0000-4000-8000-000000000003",assignment="d1000000-0000-4000-8000-000000000004",quiz="d1000000-0000-4000-8000-000000000005";
 async function actor(id:string){await db.exec("reset role");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec("set role authenticated");}
 try{
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text unique);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;");
 const dir=resolve("../../supabase");for(const file of readdirSync(resolve(dir,"migrations")).filter(f=>f.endsWith(".sql")).sort()){await db.exec(readFileSync(resolve(dir,"migrations",file),"utf8").replace("create extension if not exists vector;","").replace("create extension if not exists pgcrypto;","").replace("vector(768)","double precision[]"));}
 await db.exec(readFileSync(resolve(dir,"seed.sql"),"utf8"));
 await db.exec("grant usage on schema public to authenticated;grant select,insert,update,delete on all tables in schema public to authenticated;");
 await db.query("insert into auth.users values($1,'henok.tarikuu@astu.edu.et'),($2,'fictional-admin@example.test'),($3,'fictional-outsider@example.test')",[student,teacher,outsider]);
 await db.query("insert into public.user_roles values($1,'admin')",[teacher]);
 const setup=readFileSync(resolve(dir,"DEMO_SETUP.sql"),"utf8");await db.exec(setup);await db.exec(setup);
 await completeEarlierLessons(db,student,first);
 expect((await db.query("select * from public.assignments where id=$1",[assignment])).rows).toHaveLength(1);
 await actor(student);
 expect((await db.query("select * from public.course_enrollments where account_id=$1",[student])).rows).toHaveLength(1);
 expect((await db.query("select id from public.lessons where id=$1",[first])).rows).toHaveLength(1);
 expect((await db.query("select id from public.lessons where id=$1",[next])).rows).toHaveLength(0);
 await expect(db.query("select public.complete_lesson($1)",[first])).rejects.toThrow(/Pass the lesson assessments/);
 const started=(await db.query<{data:{attemptId:string}}>("select public.start_assessment($1) as data",[quiz])).rows[0].data;
 const answers={"d1000000-0000-4000-8000-000000000011":"Hello, my name is Alex.","d1000000-0000-4000-8000-000000000012":"meet"};
 expect((await db.query<{score:string}>("select public.submit_assessment($1,$2::jsonb) as score",[started.attemptId,JSON.stringify(answers)])).rows[0].score).toBe("100.00");
 await db.query("select public.complete_lesson($1)",[first]);
 expect((await db.query("select id from public.lessons where id=$1",[next])).rows).toHaveLength(1);
 const submission=(await db.query<{id:string}>("insert into public.submissions(assignment_id,account_id,body) values($1,$2,'Hello, my name is Alex. I study engineering. I enjoy reading. What do you enjoy?') returning id",[assignment,student])).rows[0].id;
 await expect(db.query("insert into public.submissions(assignment_id,account_id,body) values($1,$2,'Duplicate answer')",[assignment,student])).rejects.toThrow();
 await db.query("insert into public.user_notes(account_id,lesson_id,body) values($1,$2,'Remember to ask a follow-up question.')",[student,first]);
 expect((await db.query("select id from public.ai_document_chunks")).rows.length).toBeGreaterThan(0);
 await actor(outsider);
 expect((await db.query("select * from public.submissions")).rows).toHaveLength(0);
 expect((await db.query("select * from public.ai_document_chunks")).rows).toHaveLength(0);
 expect((await db.query("select * from public.user_notes")).rows).toHaveLength(0);
 await actor(teacher);
 expect((await db.query("select id from public.submissions where id=$1",[submission])).rows).toHaveLength(1);
 await db.query("insert into public.grades(submission_id,grader_id,score,feedback) values($1,$2,90,'Clear introduction. Add one more detail about your studies.')",[submission,teacher]);
 await actor(student);
 expect((await db.query<{score:string}>("select score from public.grades where submission_id=$1",[submission])).rows[0].score).toBe("90");
 expect((await db.query("select public.recording_authorized('d1000000-0000-4000-8000-000000000006') as allowed")).rows).toEqual([{allowed:false}]);
 }finally{await db.close();}
},30000);
