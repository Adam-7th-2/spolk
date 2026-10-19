import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
import {buildTutorMessages,citationsValid,OllamaProvider} from "@/lib/rag";
import {collectCourseEvidence} from "@/lib/course-evidence";
import {practiceEvidence} from "@/lib/practice-evidence";
export async function POST(request:Request){
 const user=await currentUser();if(!user)return NextResponse.json({error:"Sign in to use the tutor."},{status:401});
 const p=z.object({courseId:z.uuid(),lessonId:z.uuid().optional(),question:z.string().trim().min(3).max(1000),language:z.enum(["en","ru","am"])}).safeParse(await request.json().catch(()=>null));
 if(!p.success)return NextResponse.json({error:"Invalid question."},{status:400});
 const input=p.data;
 const db=await database();const[{data:enrolled},{data:admin},{data:teacher}]=await Promise.all([db.rpc("enrolled",{cid:input.courseId}),db.rpc("is_admin"),db.rpc("teaches",{cid:input.courseId})]);if(!enrolled&&!admin&&!teacher)return NextResponse.json({error:"This course is not available to your account."},{status:403});
 const{data:allowed,error:quotaError}=await db.rpc("consume_ai_quota");if(quotaError||!allowed)return NextResponse.json({error:"Your practice limit is reached. Your lessons remain available."},{status:429});
 try{
 const collected=await collectCourseEvidence(db,input.courseId,input.lessonId);
 const selected=practiceEvidence(input.question,input.courseId,collected.evidence,input.lessonId);
 const evidence=collected.evidence.filter(e=>selected.some(s=>s.id===e.id));
 if(!evidence.length)return NextResponse.json({answer:collected.lessons.length?"Choose a lesson and ask about its topic, or say ‘help me practice this lesson’. I can use its lesson text and linked video guidance. Scanned pages and recordings without a transcript are available in the lesson, but I cannot quote their contents yet.":"There are no released lessons available in this course yet. Ask your teacher to release a lesson.",sources:[],generated:false});
 const sources=evidence.map(e=>({id:e.id,title:e.title,lessonId:e.lessonId,url:e.url,kind:e.kind}));
 async function stillVisible(){const[{data:ok},{data:staffAdmin},{data:staffTeacher}]=await Promise.all([db.rpc("enrolled",{cid:input.courseId}),db.rpc("is_admin"),db.rpc("teaches",{cid:input.courseId})]);if(!ok&&!staffAdmin&&!staffTeacher)return false;const fresh=await collectCourseEvidence(db,input.courseId,input.lessonId);return evidence.every(e=>fresh.evidence.some(f=>f.id===e.id&&f.content===e.content));}
 if(!await stillVisible())return NextResponse.json({error:"Source access changed. Please try again."},{status:403});
 try{const answer=await new OllamaProvider().complete(buildTutorMessages(input.question,evidence,input.language));if(!citationsValid(answer,evidence))throw new Error("Unsupported citations");if(!await stillVisible())return NextResponse.json({error:"Source access changed. Please try again."},{status:403});return NextResponse.json({answer,sources,generated:true});}
 catch{if(!await stillVisible())return NextResponse.json({error:"Source access changed. Please try again."},{status:403});return NextResponse.json({answer:"Let’s use your course material. Read the short extract below, then write or say one sentence of your own. Open the lesson for its PDF, listening activities, questions and video.",excerpts:evidence.map(e=>({content:e.content,title:e.title,id:e.id})),sources,generated:false});}
 }catch{return NextResponse.json({error:"Course materials could not be loaded, or this lesson is locked. Please choose an available lesson."},{status:503});}
}
