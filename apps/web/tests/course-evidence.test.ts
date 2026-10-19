import {beforeEach,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("../src/lib/book-page-evidence",()=>({studentBookPageText:async()=>({"8":"Authorized scanned greeting page", "90":"LOCKED PAGE MUST NOT LEAK"})}));
import {collectCourseEvidence} from "../src/lib/course-evidence";
import type {database} from "../src/lib/supabase";
const lesson="6fa57655-eafe-5185-90dc-1802044a57d2";
const calls:{table:string;select?:string;filters:[string,unknown][]}[]=[];
function mockDb(){return {from(table:string){const call={table,select:"",filters:[] as [string,unknown][]};calls.push(call);const data=()=>table==="courses"?{slug:"traveller-beginners"}:table==="lessons"?[{id:lesson,title:"Introducing yourself",body:"Say hello and your name."}]:table==="book_lesson_pages"?[{lesson_id:lesson,pdf_page:8}]:[];const query={select(s:string){call.select=s;return query},eq(k:string,v:unknown){call.filters.push([k,v]);return query},in(k:string,v:unknown){call.filters.push([k,v]);return query},order(){return query},limit(){return query},single:async()=>({data:data()}),then(resolve:(x:unknown)=>unknown){return Promise.resolve({data:data(),error:null}).then(resolve)}};return query}} as unknown as Awaited<ReturnType<typeof database>>;}
beforeEach(()=>calls.splice(0));
it("retrieves OCR only for RLS-visible lesson page rows",async()=>{const result=await collectCourseEvidence(mockDb(),"course",lesson);const text=JSON.stringify(result);expect(text).toContain("Authorized scanned greeting page");expect(text).not.toContain("LOCKED PAGE MUST NOT LEAK");expect(calls.find(c=>c.table==="book_lesson_pages")?.filters).toContainEqual(["lesson_id",[lesson]]);});
it("rejects a selected lesson absent from readable lesson rows",async()=>{await expect(collectCourseEvidence(mockDb(),"course","locked")).rejects.toThrow("locked");expect(calls.some(c=>c.table==="book_lesson_pages")).toBe(false);});
it("uses course filters and never queries answer keys or question answers",async()=>{const result=await collectCourseEvidence(mockDb(),"course");expect(result.evidence.every(e=>e.courseId==="course")).toBe(true);expect(calls.find(c=>c.table==="lessons")?.filters).toContainEqual(["course_id","course"]);expect(calls.some(c=>/answer|assessment_questions|sittings/.test(c.table))).toBe(false);expect(JSON.stringify(result)).not.toContain("correct_answer");});
