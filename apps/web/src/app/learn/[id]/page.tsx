export const dynamic="force-dynamic";
import {notFound} from "next/navigation";
import Link from "next/link";
import {requireUser} from "@/lib/access";
import {database} from "@/lib/supabase";
import {learningPlan} from "@/lib/learning-plan";
import {CourseOutline} from "@/components/course-outline";
import {LearningSteps} from "@/components/learning-steps";
import {TravellerVideo} from "@/components/traveller-video";
import {travellerVideo} from "@/lib/traveller-videos";
import {ActionForm} from "@/components/action-form";
import {TravellerExamPanel} from "@/components/traveller-exam-panel";
import {examManifest} from "@/lib/traveller-exams";
import {BookHomework} from "@/components/book-homework";
import traveller from "@/content/traveller.json";
import {BookLesson} from "@/components/book-lesson";
import {Quiz} from "@/components/quiz";
import {AttachmentList} from "@/components/attachment-list";
import {HomeworkForm} from "@/components/homework-form";
import {saveNote,completeLesson} from "@/app/workspace/actions";
import {Chatbot} from "@/components/chatbot";
import {loadActor} from "@/lib/actor";
import {formatWhen} from "@/lib/local-time";
export default async function Lesson({params}:{params:Promise<{id:string}>}){
 const user=await requireUser();const actor=await loadActor();const zone=actor?.timezone||"UTC";const{id}=await params;const db=await database();
 const{data:lesson,error}=await db.from("lessons").select("id,title,body,course_id").eq("id",id).maybeSingle();if(error||!lesson)notFound();
 const[notes,assignments,quizzes,plan]=await Promise.all([
  db.from("user_notes").select("id,body").eq("lesson_id",id).eq("account_id",user.id),
  db.from("assignments").select("id,title,instructions,due_at").eq("lesson_id",id),
  db.from("assessments").select("id,title").eq("lesson_id",id),
  learningPlan(lesson.course_id,user.id),
 ]);
 if([notes,assignments,quizzes].some(r=>r.error)||!plan)throw new Error("Unable to load lesson activities.");
 const {course,modules,items}=plan;const index=items.findIndex(l=>l.id===id);const item=items[index];const previous=items[index-1];const next=items[index+1];
 const isExam=course.slug==="traveller-beginners"&&examManifest.exams.some(e=>e.lessonId===id);
 const bookLesson=course.slug==="traveller-beginners"?traveller.lessons.find(l=>l.id===id):undefined;
 const displayBody=bookLesson?lesson.body.replace(/Listening:[\s\S]*?(?=Spolk practice|$)/i,"Listening: use the supplied Traveller Beginner CD/track player below. Select the CD and track printed beside the original exercise; the course preserves the source order and keeps answer keys private.\n"):lesson.body;
 const video=bookLesson?travellerVideo(id):undefined;
 const assignmentIds=assignments.data?.map(a=>a.id)||[];
 const submissions=assignmentIds.length?await db.from("submissions").select("id,assignment_id,body").eq("account_id",user.id).in("assignment_id",assignmentIds):{data:[],error:null};
 const submissionIds=submissions.data?.map(s=>s.id)||[];
 const grades=submissionIds.length?await db.from("grades").select("submission_id,score,feedback").in("submission_id",submissionIds):{data:[],error:null};
 if(submissions.error||grades.error)throw new Error("Unable to load your homework feedback.");
 const homework=assignments.data?.map(a=>{const submission=submissions.data?.find(s=>s.assignment_id===a.id);const grade=submission?grades.data?.find(g=>g.submission_id===submission.id):null;return <article className="form-card" key={a.id}><h3>{a.title}</h3><p>{a.instructions}</p>{a.due_at&&<p>Due: {formatWhen(a.due_at,zone)}</p>}{submission?<><p className="status">Work submitted</p><AttachmentList submissionId={submission.id}/><p style={{whiteSpace:"pre-wrap"}}>{submission.body}</p>{grade?<div className="status"><strong>Teacher grade: {grade.score}/100</strong><p>{grade.feedback}</p></div>:<p>Awaiting teacher feedback. Your grade will appear here.</p>}</>:isExam?<p>Use the timed exam activity to submit this paper.</p>:bookLesson?<BookHomework assignmentId={a.id} pages={bookLesson.pages}/>:<HomeworkForm assignmentId={a.id}/>}</article>});
 const steps=[
  ...(video?[{id:"watch",title:"Watch",description:"Build your listening confidence with a short, related video taught in English.",content:<TravellerVideo key={id} lessonId={id}/>}]:[]),
  ...(isExam?[{id:"exam",title:"Timed exam",description:"Review the schedule, start your attempt, then use the original paper and matching listening audio.",content:<TravellerExamPanel lessonId={id}/>}]:[{id:"read",title:"Read & learn",description:bookLesson?"Work through every original page and its numbered exercises in order.":"Read the lesson and practise its main ideas.",content:<><article className="dashboard-card"><h3>Lesson instructions</h3><p style={{whiteSpace:"pre-wrap"}}>{displayBody}</p></article>{bookLesson&&<BookLesson lessonId={id}/>}</>}]),
  ...(quizzes.data?.length?[{id:"practice",title:"Practice quiz",description:"Check your understanding. Scores, deadlines and attempt limits are enforced by the server.",content:<>{quizzes.data.map(q=><Quiz key={q.id} assessmentId={q.id} title={q.title}/>)}</>}]:[]),
  ...(assignments.data?.length?[{id:"homework",title:isExam?"Grade & feedback":"Assignment",description:isExam?"Review your submitted exam and your teacher’s feedback here.":"Submit the original tasks for your teacher to review. Return here for grades and feedback.",content:<>{homework}</>}]:[]),
  {id:"notes",title:"Notes",description:"Save useful language and questions for your teacher. Your notes are private.",content:<article className="form-card"><h3>Your notebook</h3>{notes.data?.map(n=><p key={n.id}>{n.body}</p>)}<ActionForm action={saveNote} label="Save private note"><input type="hidden" name="lesson_id" value={id}/><label>Your note<textarea name="body" required maxLength={20000}/></label></ActionForm></article>},
  {id:"complete",title:"Finish lesson",description:"Review your work and record completion when the lesson requirements are met.",content:<article className="dashboard-card"><h3>{item?.completed?"Lesson completed":"Ready for the next step?"}</h3><p>Pass any required quizzes and receive the required teacher approval for your original exercises before marking this lesson complete. Watching a video alone does not complete it.</p>{item?.completed?<p className="status">Your completion is saved.</p>:<ActionForm action={completeLesson} label="Mark lesson complete"><input name="lesson_id" type="hidden" value={id}/></ActionForm>}{next?.available?<p><Link className="text-link" href={`/learn/${next.id}`}>Next: {next.title} →</Link></p>:next?<p>Complete this lesson’s requirements to unlock the next lesson. Scheduled release dates also apply.</p>:<p>You have reached the end of the course content. Review your course progress and any remaining work.</p>}</article>},
 ];
 return <section className="lms-shell"><CourseOutline courseId={course.id} title={course.title} modules={modules} items={items} current={id}/><div className="lms-main"><div className="lms-breadcrumb"><Link href={`/dashboard/courses/${course.id}`}>{course.title}</Link><span>/</span><span>{isExam?"Exam":"Lesson"}</span></div><header className="lms-lesson-header"><div className="eyebrow">{modules.find(m=>m.id===item?.moduleId)?.title||"COURSE LESSON"}</div><h1>{lesson.title}</h1><div className="lms-stats">{item?.week&&<span>Week {item.week}</span>}{item?.minutes&&<span>{item.minutes} minutes suggested</span>}<span>{item?.completed?"Completed":"In progress"}</span>{isExam&&<span>Teacher-graded exam</span>}</div></header><LearningSteps key={id} steps={steps} lessonId={await db.rpc("enrolled",{cid:course.id}).then(r=>r.data)?id:undefined}/><nav className="lms-lesson-navigation" aria-label="Adjacent lessons">{previous?.available?<Link href={`/learn/${previous.id}`}>← {previous.title}</Link>:<span/>}<Link href={`/dashboard/courses/${course.id}`}>Course overview</Link>{next?.available?<Link href={`/learn/${next.id}`}>{next.title} →</Link>:<span/>}</nav>{!isExam&&<Chatbot courses={[{id:course.id,title:course.title}]} initialCourseId={course.id} askLabel="Ask about this activity" />}</div></section>;
}
