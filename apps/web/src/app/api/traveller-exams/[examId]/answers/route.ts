import {hasSameOrigin} from "@/lib/request-origin";
import {NextResponse} from "next/server";
import {currentUser,database} from "@/lib/supabase";
import {travellerExam} from "@/lib/traveller-exams";
import {parseAnswerSheet} from "@/lib/exam-grading";
import {answerIndex,extractAnswerFile,validateAnswerFile,storeAnswerFile,uploadedAnswer,listAnswerUploads,referenceReview} from "@/lib/exam-answer-store";
export const runtime="nodejs";
const noStore={"Cache-Control":"private, no-store"};
async function context(request:Request,examId:string){
 const user=await currentUser();if(!user)return {error:NextResponse.json({error:"Sign in first."},{status:401})};
 const entry=travellerExam(examId);if(!entry)return {error:NextResponse.json({error:"Unknown test."},{status:404})};
 const db=await database();const{data:exam}=await db.from("traveller_exams").select("course_id,closes_at").eq("id",examId).maybeSingle();if(!exam)return {error:NextResponse.json({error:"Test unavailable."},{status:403})};
 const[{data:admin},{data:teacher}]=await Promise.all([db.rpc("is_admin"),db.rpc("teaches",{cid:exam.course_id})]);const staff=Boolean(admin||teacher);
 const accountId=new URL(request.url).searchParams.get("account")||user.id;if(!/^[0-9a-f-]{36}$/i.test(accountId)||(accountId!==user.id&&!staff))return {error:NextResponse.json({error:"Forbidden."},{status:403})};
 const{data:sitting}=await db.from("traveller_exam_sittings").select("started_at,deadline,draft,submitted_at,submission_id").eq("exam_id",examId).eq("account_id",accountId).maybeSingle();
 return {user,db,entry,exam,staff,accountId,sitting};
}
export async function GET(request:Request,{params}:{params:Promise<{examId:string}>}){
 const{examId}=await params;const ctx=await context(request,examId);if(ctx.error)return ctx.error;
 const url=new URL(request.url);
 try{
  if(url.searchParams.has("template")){
   const active=ctx.sitting&&!ctx.sitting.submitted_at&&Date.parse(ctx.sitting.deadline)>Date.now();if(!ctx.staff&&!active)return NextResponse.json({error:"Start the timed test first."},{status:403});
   const index=await answerIndex(examId);const template=index.fields.map(f=>`${f.id}: `).join("\n");return new Response(template,{headers:{...noStore,"Content-Type":"text/plain; charset=utf-8","Content-Disposition":`attachment; filename="${examId}-answer-sheet.txt"`}});
  }
  const download=url.searchParams.get("download");if(download){if(!ctx.sitting)return NextResponse.json({error:"Attempt not found."},{status:403});const{record,bytes}=await uploadedAnswer(ctx.accountId,examId,download);if(record.startedAt!==ctx.sitting.started_at)return NextResponse.json({error:"File does not belong to this attempt."},{status:403});return new Response(new Uint8Array(bytes),{headers:{...noStore,"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename="answer-${record.id}.${record.kind}"`,"X-Content-Type-Options":"nosniff"}});}
  if(!ctx.sitting?.submitted_at||!ctx.sitting.submission_id)return NextResponse.json({error:"Submit the test before viewing feedback. Answer keys stay private during the attempt."},{status:403});
  const{data:submission}=await ctx.db.from("submissions").select("body").eq("id",ctx.sitting.submission_id).eq("account_id",ctx.accountId).maybeSingle();if(!submission)return NextResponse.json({error:"Submission unavailable."},{status:403});
  if(!ctx.staff){
   const{data:grade,error:gradeError}=await ctx.db.from("grades").select("score,feedback,graded_at").eq("submission_id",ctx.sitting.submission_id).maybeSingle();
   if(gradeError)return NextResponse.json({error:"Your grade could not be loaded. Please retry."},{status:503,headers:noStore});
   const uploads=(await listAnswerUploads(ctx.accountId,examId)).filter(u=>u.startedAt===ctx.sitting!.started_at);
   return NextResponse.json({report:null,grade:grade?{score:grade.score,feedback:grade.feedback,gradedAt:grade.graded_at}:null,uploads:uploads.map(u=>({id:u.id,name:u.name,manualReview:u.manualReview,createdAt:u.createdAt}))},{headers:noStore});
  }
  const report=await referenceReview(examId,submission.body);const uploads=(await listAnswerUploads(ctx.accountId,examId)).filter(u=>u.startedAt===ctx.sitting!.started_at);
  return NextResponse.json({report,uploads:uploads.map(u=>({id:u.id,name:u.name,manualReview:u.manualReview,createdAt:u.createdAt}))},{headers:noStore});
 }catch{return NextResponse.json({error:"The file or private grading reference is unavailable. Your teacher can still review the submitted work."},{status:503,headers:noStore});}
}
export async function POST(request:Request,{params}:{params:Promise<{examId:string}>}){
 if(!hasSameOrigin(request))return NextResponse.json({error:"Invalid origin."},{status:403});
 const{examId}=await params;const ctx=await context(request,examId);if(ctx.error)return ctx.error;
 if(ctx.staff||ctx.accountId!==ctx.user.id)return NextResponse.json({error:"Uploads are for the student’s own timed attempt."},{status:403});
 if(!ctx.sitting||ctx.sitting.submitted_at||Date.parse(ctx.sitting.deadline)<=Date.now()||Date.parse(ctx.exam.closes_at)<=Date.now())return NextResponse.json({error:"Start the test and upload before its deadline."},{status:403});
 try{
  // Bound actual streamed bytes rather than trusting Content-Length.
  const reader=request.body?.getReader();if(!reader)throw new Error("Choose an answer file.");const chunks:Uint8Array[]=[];let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>6*1024*1024+65536){await reader.cancel();return NextResponse.json({error:"Maximum upload size is 6 MB."},{status:413});}chunks.push(part.value);}
  const form=await new Request(request.url,{method:"POST",headers:{"Content-Type":request.headers.get("content-type")||""},body:Buffer.concat(chunks)}).formData();const file=form.get("file");if(!(file instanceof File))throw new Error("Choose an answer file.");
  const bytes=Buffer.from(await file.arrayBuffer());const kind=validateAnswerFile(file.name,bytes);const extracted=await extractAnswerFile(bytes,kind);if(extracted.text.length>12000)throw new Error("Use a shorter answer sheet with at most 12000 text characters.");if(extracted.text.includes("\0"))throw new Error("Answer text contains unsupported characters.");
  const index=await answerIndex(examId);const mapped=Object.keys(parseAnswerSheet(extracted.text,index.fields)).length;const manualReview=extracted.manualReview||mapped===0;
  // The database rechecks the deadline after extraction, before accepting the text.
  const text=`[ANSWER_FILE_TEXT]\n${extracted.text||"[Scanned or handwritten answer file: teacher transcription required.]"}\n[/ANSWER_FILE_TEXT]`;const answers:Record<string,string>={};for(let n=0;n<Math.ceil(text.length/3500);n++)answers[`page-${n+1}`]=text.slice(n*3500,(n+1)*3500);
  const saved=await ctx.db.rpc("save_traveller_exam_draft",{eid:examId,answers});if(saved.error)return NextResponse.json({error:"The deadline passed or access changed. The upload was not accepted."},{status:403});
  const upload=await storeAnswerFile(ctx.user.id,examId,ctx.sitting.started_at,file.name,kind,bytes,manualReview);
  return NextResponse.json({answers,upload:{id:upload.id,name:upload.name},mappedAnswers:mapped,manualReview,message:manualReview?"File saved. A teacher must check the handwriting or question numbering. Confirm submission when ready.":"Answer text saved as your draft. Review it and confirm final submission to receive feedback."},{headers:noStore});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Upload could not be read."},{status:400,headers:noStore});}
}
