import {hasSameOrigin} from "@/lib/request-origin";
import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
import {travellerExam} from "@/lib/traveller-exams";
const answers=z.record(z.string().regex(/^page-[1-4]$/),z.string().max(3500));
const schema=z.discriminatedUnion("action",[z.object({action:z.literal("start")}),z.object({action:z.literal("draft"),answers}),z.object({action:z.literal("submit"),answers})]);
export async function POST(request:Request,{params}:{params:Promise<{examId:string}>}){
 if(!hasSameOrigin(request))return NextResponse.json({error:"Invalid origin."},{status:403});if(!await currentUser())return NextResponse.json({error:"Sign in first."},{status:401});const{examId}=await params;if(!travellerExam(examId))return NextResponse.json({error:"Unknown exam."},{status:404});const p=schema.safeParse(await request.json().catch(()=>null));if(!p.success)return NextResponse.json({error:"Invalid exam request."},{status:400});const db=await database();
 const result=p.data.action==="start"?await db.rpc("start_traveller_exam",{eid:examId}):p.data.action==="draft"?await db.rpc("save_traveller_exam_draft",{eid:examId,answers:p.data.answers}):await db.rpc("submit_traveller_exam",{eid:examId,answers:p.data.answers});
 if(result.error)return NextResponse.json({error:p.data.action==="start"?"Exam unavailable: check the schedule, enrollment and whether your attempt has ended.":"The exam could not accept this change. Your time may have ended or your access changed. Refresh to review your saved attempt."},{status:403});return NextResponse.json({data:result.data},{headers:{"Cache-Control":"no-store"}});
}
