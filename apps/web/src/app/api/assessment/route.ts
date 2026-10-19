import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
import {lessonGuidance} from "@/lib/lesson-guidance";
import {hasSameOrigin} from "@/lib/request-origin";
import book from "@/content/traveller.json";
const hints=new Map(book.lessons.flatMap(lesson=>lesson.questions.map(question=>[question.id,lessonGuidance(question.prompt,question.correct_answer).hint] as const)));
const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("start"),assessmentId:z.uuid()}),
 z.object({action:z.literal("answer"),attemptId:z.uuid(),questionId:z.uuid(),response:z.string().trim().min(1).max(1000)}),
 z.object({action:z.literal("submit"),attemptId:z.uuid(),responses:z.record(z.uuid(),z.string().max(1000))}),
]);
type Feedback={id:string;prompt:string;selected:string|null;correctAnswer:string;correct:boolean};
const explain=(answer:Feedback)=>({...answer,...lessonGuidance(answer.prompt,answer.correctAnswer)});
export async function POST(req:Request){
 if(!hasSameOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});
 if(!await currentUser())return NextResponse.json({error:"Unauthorized"},{status:401});
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Invalid assessment request"},{status:400});
 const input=parsed.data,db=await database();
 const failure=(code?:string)=>NextResponse.json({error:code==="PGRST202"?"Your teacher needs to enable the updated practice quiz.":"Assessment unavailable. Check your lesson access, attempt limit, and deadline."},{status:403});
 if(input.action==="start"){
  const{data,error}=await db.rpc("start_assessment",{aid:input.assessmentId});if(error)return failure(error.code);
  const{data:review,error:reviewError}=await db.rpc("assessment_practice_review",{attempt_id:data.attemptId});if(reviewError)return failure(reviewError.code);
  return NextResponse.json({...data,questions:data.questions.map((q:{id:string;prompt:string})=>({...q,hint:hints.get(q.id)||"Read the whole sentence. Look at the subject, time words, and the purpose of the question."})),answered:(review.answers as Feedback[]).map(explain)},{headers:{"Cache-Control":"no-store"}});
 }
 if(input.action==="answer"){
  const{data,error}=await db.rpc("answer_assessment_question",{attempt_id:input.attemptId,question_id:input.questionId,response:input.response});
  if(error)return failure(error.code);
  return NextResponse.json(explain(data as Feedback),{headers:{"Cache-Control":"no-store"}});
 }
 const{data:score,error}=await db.rpc("submit_assessment",{attempt_id:input.attemptId,responses:input.responses});if(error)return failure(error.code);
 const{data:review,error:reviewError}=await db.rpc("assessment_practice_review",{attempt_id:input.attemptId});if(reviewError)return failure(reviewError.code);
 return NextResponse.json({score,answers:(review.answers as Feedback[]).map(explain),expired:review.expired},{headers:{"Cache-Control":"no-store"}});
}
