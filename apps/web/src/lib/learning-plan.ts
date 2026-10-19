import {database} from "./supabase";
import {buildCoursePlan} from "./course-plan";
export async function learningPlan(courseId:string,accountId:string){
 const db=await database();
 const [course,lessons,modules,progress,assignments,quizzes]=await Promise.all([
  db.from("courses").select("id,slug,title,description").eq("id",courseId).maybeSingle(),
  db.rpc("course_learning_outline",{cid:courseId}),
  db.from("modules").select("id,title,position").eq("course_id",courseId).order("position"),
  db.from("lesson_progress").select("lesson_id").eq("account_id",accountId),
  db.from("assignments").select("lesson_id").eq("course_id",courseId),
  db.from("assessments").select("lesson_id").eq("course_id",courseId),
 ]);
 if([course,lessons,modules,progress,assignments,quizzes].some(r=>r.error))throw new Error("Unable to load your course learning path.");
 if(!course.data)return null;
 const isTraveller=course.data.slug==="traveller-beginners";
 const schedule=isTraveller?await db.from("traveller_exams").select("lesson_id,study_week,minutes,opens_at,closes_at").eq("course_id",courseId):{data:[],error:null};
 if(schedule.error&&!["42P01","PGRST205"].includes(schedule.error.code))throw new Error("Unable to load the exam schedule.");
 const items=buildCoursePlan({traveller:isTraveller,lessons:lessons.data||[],modules:modules.data||[],completed:progress.data?.map(p=>p.lesson_id)||[],assignments:assignments.data||[],quizzes:quizzes.data||[],schedule:schedule.data||[]});
 return {course:course.data,modules:modules.data||[],items};
}
