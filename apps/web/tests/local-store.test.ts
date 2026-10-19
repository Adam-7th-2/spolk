import {beforeAll,afterAll,it,expect} from "vitest";
import {resolve,basename,sep} from "node:path";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {openLocalStore,demoAccounts,demoPassword} from "../src/lib/local-store";
import {LocalQuery,localRpc} from "../src/lib/local-query";
let store:Awaited<ReturnType<typeof openLocalStore>>;
beforeAll(async()=>{store=await openLocalStore("memory://",resolve("../.."));},60000);
afterAll(async()=>{await store?.db.close();});
it("uses password authentication and revocable sessions",async()=>{
 expect(await store.login(demoAccounts[0].email,"wrong-password")).toBeNull();
 const session=await store.login(demoAccounts[0].email,demoPassword);
 expect(session).not.toBeNull();
 expect((await store.user(session!.token))?.email).toBe(demoAccounts[0].email);
 expect(await store.user("forged-session")).toBeNull();
 await store.logout(session!.token);
 expect(await store.user(session!.token)).toBeNull();
});
it("installs the exact Traveller manifest and keeps student answer keys private",async()=>{
 const student=demoAccounts[0].id;
 const books=await new LocalQuery(store,student,"book_lesson_pages").select("pdf_page").order("pdf_page");
 expect(books.error).toBeNull();expect((books.data as unknown[]).length).toBeLessThan(126);
 const allPages=await new LocalQuery(store,demoAccounts[2].id,"book_lesson_pages").select('pdf_page');expect(allPages.data).toHaveLength(126);
 const keys=await new LocalQuery(store,student,"assessment_questions").select("correct_answer");
 expect(keys.data).toEqual([]);
 expect((await localRpc(store,student,"is_admin")).data).toBe(false);
 expect((await localRpc(store,demoAccounts[2].id,"is_admin")).data).toBe(true);
});
it("new accounts are students and cannot read other students' work",async()=>{
 const other=await store.signup("new-learner@spolk.local","ValidLocalPassword2026!");
 const roles=await new LocalQuery(store,other.id,"user_roles").select("role");
 expect(roles.data).toEqual([{role:"student"}]);
 const result=await new LocalQuery(store,other.id,"submissions").insert({assignment_id:"d1000000-0000-4000-8000-000000000004",account_id:demoAccounts[0].id,body:"Trying to submit as another student"});
 expect(result.error?.code).toBe("42501");
});
it("isolates actor roles across concurrent reads and validates identifiers",async()=>{
 const results=await Promise.all([localRpc(store,demoAccounts[2].id,"is_admin"),localRpc(store,demoAccounts[0].id,"is_admin"),localRpc(store,null,"is_admin")]);
 expect(results.map(result=>result.data)).toEqual([true,false,false]);
 const bad=await new LocalQuery(store,demoAccounts[0].id,"profiles;drop table public.profiles").select("id");
 expect(bad.error).not.toBeNull();
});
it("persists a private note and session after reopening the database",async()=>{
 const directory=await mkdtemp(resolve(tmpdir(),"spolk-local-"));
 let disk:Awaited<ReturnType<typeof openLocalStore>>|undefined;
 try{
  disk=await openLocalStore(directory,resolve("../.."));
  const session=await disk.login(demoAccounts[0].email,demoPassword);
  const note=await new LocalQuery(disk,demoAccounts[0].id,"user_notes").insert({account_id:demoAccounts[0].id,lesson_id:"c2c67850-7d04-5fad-8ff7-f6fede1c4765",body:"Persistence test note"}).select("id").single();
  expect(note.error).toBeNull();
  await disk.db.close();disk=await openLocalStore(directory,resolve("../.."));
  expect((await disk.user(session!.token))?.id).toBe(demoAccounts[0].id);
  const notes=await new LocalQuery(disk,demoAccounts[0].id,"user_notes").select("body");
  expect(notes.data).toEqual([{body:"Persistence test note"}]);
 }finally{
  await disk?.db.close();
  if(resolve(directory).startsWith(resolve(tmpdir())+sep)&&basename(directory).startsWith("spolk-local-"))await rm(directory,{recursive:true,force:true});
 }
},60000);
