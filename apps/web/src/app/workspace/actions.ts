"use server";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {requireRole,requireUser} from "@/lib/access";
import {database} from "@/lib/supabase";
import {storeHomeworkFile,removeHomeworkFile,type HomeworkFile} from "@/lib/homework-files";
import {localInputToUtc} from "@/lib/local-time";
const result=(error:unknown,ok:string)=>({error:Boolean(error),message:error?"This change could not be saved. Check your permissions and input.":ok});
export async function approve(_:unknown,f:FormData){const {db}=await requireRole(["admin","super_admin"]);const id=z.uuid().safeParse(f.get("id"));if(!id.success)return result(true,"");const{error}=await db.rpc("approve_application",{application_id:id.data});revalidatePath("/admin");return result(error,"Enrollment approved.");}
export async function createSchool(_:unknown,f:FormData){const {db}=await requireRole(["admin","super_admin"]);const p=z.object({name:z.string().min(3).max(100),slug:z.string().regex(/^[a-z0-9-]{3,60}$/)}).safeParse(Object.fromEntries(f));if(!p.success)return result(true,"");const{error}=await db.from("schools").insert({...p.data,published:true});revalidatePath("/admin");return result(error,"School created.");}
export async function createLesson(_:unknown,f:FormData){const {db,user}=await requireRole(["teacher","admin","super_admin"]);const raw=Object.fromEntries(f);const profile=await db.from("profiles").select("timezone").eq("id",user.id).maybeSingle();let released="";try{released=typeof raw.released_at==="string"?localInputToUtc(raw.released_at,profile.data?.timezone||"UTC"):"";}catch{return result(true,"");}const p=z.object({course_id:z.uuid(),module_id:z.uuid(),title:z.string().min(3).max(200),body:z.string().min(10).max(30000),position:z.coerce.number().int().min(0),released_at:z.string().datetime({offset:true})}).safeParse({...raw,released_at:released});if(!p.success)return result(true,"");const{error}=await db.from("lessons").insert(p.data);revalidatePath("/teacher");return result(error,"Lesson created.");}
export async function submitHomework(_:unknown,f:FormData){
 await requireUser();const db=await database();
 const p=z.object({assignment_id:z.uuid(),body:z.string().trim().max(20000)}).safeParse(Object.fromEntries(f));
 if(!p.success)return {error:true,message:"Check your assignment and keep the answer under 20,000 characters."};
 const files=f.getAll('files').filter((file):file is File=>file instanceof File&&file.size>0);
 if(files.length>3||(!p.data.body&&files.length===0))return {error:true,message:"Add an answer or upload up to 3 files."};
 const{data:assignment}=await db.from('assignments').select('id,course_id').eq('id',p.data.assignment_id).maybeSingle();
 if(!assignment)return result(true,'');
 const stored:HomeworkFile[]=[];
 try{
  for(const file of files)stored.push(await storeHomeworkFile(file));
  const{error}=await db.rpc('submit_homework_files',{aid:p.data.assignment_id,answer:p.data.body,files:stored});
  if(error){await Promise.all(stored.map(file=>removeHomeworkFile(file.id)));return {error:true,message:error.message.includes('deadline')?'The assignment deadline has passed. Ask your teacher for help.':'Submission could not be saved. Check whether it was already submitted or the lesson is locked.'};}
 }catch(error){await Promise.all(stored.map(file=>removeHomeworkFile(file.id)));return {error:true,message:error instanceof Error?error.message:'Files could not be uploaded. Please try again.'};}
 revalidatePath('/dashboard');revalidatePath('/learn','layout');revalidatePath('/teacher');return result(null,'Homework and attachments submitted for teacher review.');
}
export async function saveNote(_:unknown,f:FormData){const user=await requireUser();const db=await database();const p=z.object({lesson_id:z.uuid(),body:z.string().trim().min(1).max(20000)}).safeParse(Object.fromEntries(f));if(!p.success)return result(true,"");const{error}=await db.from("user_notes").insert({...p.data,account_id:user.id});revalidatePath(`/learn/${p.data.lesson_id}`);return result(error,"Your private note is saved.");}
export async function gradeHomework(_:unknown,f:FormData){const {user,db}=await requireRole(["teacher","admin","super_admin"]);const p=z.object({submission_id:z.uuid(),score:z.coerce.number().min(0).max(100),feedback:z.string().min(1).max(10000)}).safeParse(Object.fromEntries(f));if(!p.success)return result(true,"");const{error}=await db.from("grades").upsert({...p.data,grader_id:user.id},{onConflict:"submission_id"});revalidatePath("/teacher");revalidatePath("/dashboard");revalidatePath("/learn", "layout");return result(error,"Feedback saved.");}

export async function completeLesson(_:unknown,f:FormData){await requireUser();const db=await database();const p=z.uuid().safeParse(f.get("lesson_id"));if(!p.success)return result(true,"");const{error}=await db.rpc("complete_lesson",{lid:p.data});revalidatePath(`/learn/${p.data}`);revalidatePath("/dashboard");revalidatePath('/dashboard/courses','layout');if(error)return {error:true,message:error.message.includes('assessments')?'Pass the required practice quizzes before completing this lesson.':error.message.includes('teacher approval')?'Submit your original-page work and receive a teacher grade of at least 70% before completing this lesson.':'This lesson cannot be completed yet. Check earlier lessons and the release schedule.'};return result(null,"Lesson completed. Your progress is saved.");}

export async function postCourseAnnouncement(_:unknown,f:FormData){
 const{db}=await requireRole(['teacher','admin','super_admin']);const p=z.object({course_id:z.uuid(),body:z.string().trim().min(5).max(5000)}).safeParse(Object.fromEntries(f));if(!p.success)return {error:true,message:'Choose a course and write an update of 5–5,000 characters.'};
 const{error}=await db.from('announcements').insert(p.data);revalidatePath('/teacher');return result(error,'Course update posted. Enrolled students have been notified.');
}

export async function gradeExam(_:unknown,f:FormData){const{user,db}=await requireRole(["teacher","admin","super_admin"]);const p=z.object({submission_id:z.uuid(),raw_score:z.coerce.number().min(0).max(100),feedback:z.string().min(1).max(10000)}).safeParse(Object.fromEntries(f));if(!p.success)return result(true,"");const{data:submission}=await db.from("submissions").select("assignment_id").eq("id",p.data.submission_id).maybeSingle();if(!submission)return result(true,"");const{data:exam}=await db.from("traveller_exams").select("course_id,max_marks").eq("assignment_id",submission.assignment_id).maybeSingle();if(!exam||p.data.raw_score>exam.max_marks)return result(true,"");const[{data:teacher},{data:admin}]=await Promise.all([db.rpc("teaches",{cid:exam.course_id}),db.rpc("is_admin")]);if(!teacher&&!admin)return result(true,"");const score=Math.round(p.data.raw_score/exam.max_marks*10000)/100;const{error}=await db.from("grades").upsert({submission_id:p.data.submission_id,grader_id:user.id,score,feedback:p.data.feedback},{onConflict:"submission_id"});revalidatePath("/teacher");revalidatePath("/dashboard");revalidatePath("/learn","layout");return result(error,"Original marks saved and converted to a percentage.");}
