import book from "../content/traveller.json";
import exams from "../content/traveller-exams.json";
export type PlanItem={id:string;title:string;moduleId:string;position:number;week?:number;minutes?:number;kind:string;available:boolean;completed:boolean;quizCount:number;assignmentCount:number;opens?:string;closes?:string};
export type PlanModule={id:string;title:string;position:number};
type Lesson={id:string;title:string;module_id:string;position:number;available?:boolean};
type Schedule={lesson_id:string;study_week:number;minutes:number;opens_at:string;closes_at:string};
export function buildCoursePlan({traveller,lessons,modules,completed,assignments=[],quizzes=[],schedule=[]}:{traveller:boolean;lessons:Lesson[];modules:PlanModule[];completed:string[];assignments?:{lesson_id:string}[];quizzes?:{lesson_id:string}[];schedule?:Schedule[]}){
 const accessible=new Set(lessons.filter(l=>l.available!==false).map(l=>l.id));const done=new Set(completed);
 const rows=traveller?[...book.lessons.map(l=>({id:l.id,title:l.title,module_id:l.module_id,position:l.position})),...lessons.filter(l=>!book.lessons.some(b=>b.id===l.id))]:lessons;
 // Upcoming exam titles are syllabus metadata; their protected content remains inaccessible.
 if(traveller)for(const s of schedule){const e=exams.exams.find(e=>e.lessonId===s.lesson_id);if(e&&!rows.some(l=>l.id===e.lessonId))rows.push({id:e.lessonId,title:e.title,module_id:e.moduleId,position:e.position});}
 const items:PlanItem[]=rows.filter(l=>modules.some(m=>m.id===l.module_id)).map(l=>{
  const b=traveller?book.lessons.find(b=>b.id===l.id):undefined;const e=schedule.find(s=>s.lesson_id===l.id);
  return {id:l.id,title:l.title,moduleId:l.module_id,position:l.position,week:e?.study_week??b?.week,minutes:e?.minutes??b?.minutes,kind:e?"exam":b?.kind||"lesson",available:accessible.has(l.id),completed:done.has(l.id),quizCount:quizzes.filter(q=>q.lesson_id===l.id).length,assignmentCount:assignments.filter(a=>a.lesson_id===l.id).length,opens:e?.opens_at,closes:e?.closes_at};
 }).sort((a,b)=>(modules.find(m=>m.id===a.moduleId)!.position-modules.find(m=>m.id===b.moduleId)!.position)||a.position-b.position||a.id.localeCompare(b.id));
 return items;
}
