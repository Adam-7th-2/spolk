import {NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {currentUser,database} from "@/lib/supabase";
import {examAsset,byteRange,canAccessExamAsset} from "@/lib/traveller-exams";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{examId:string;asset:string}>}){
 if(!await currentUser())return NextResponse.json({error:"Sign in first."},{status:401});
 const{examId,asset}=await params;const entry=examAsset(examId,asset);if(!entry)return NextResponse.json({error:"Unknown exam resource."},{status:404});
 const db=await database();const{data:admin}=await db.rpc("is_admin");
 let staff=Boolean(admin);
 if(!staff){const{data:source}=await db.from("book_sources").select("course_id").eq("id","traveller-beginners").maybeSingle();if(source){const{data:teacher}=await db.rpc("teaches",{cid:source.course_id});staff=Boolean(teacher);}}
 if(entry.staffOnly&&!staff)return NextResponse.json({error:"Teacher answers and editable documents are restricted to assigned course staff."},{status:403});
 let active=false;if(!staff){const{data:allowed}=await db.rpc("can_read_traveller_exam_media",{eid:examId});active=Boolean(allowed);}
 if(!canAccessExamAsset(entry,staff,active))return NextResponse.json({error:"Start this exam during its scheduled window to open its resources."},{status:403});
 try{const bytes=await readFile(resolve(process.cwd(),"private/books/traveller/exams",entry.filename));const range=byteRange(request.headers.get("range"),bytes.length);const headers:Record<string,string>={"Content-Type":entry.type,"Cache-Control":"private, no-store","Accept-Ranges":"bytes","X-Content-Type-Options":"nosniff"};if(entry.download)headers["Content-Disposition"]=`attachment; filename="${entry.filename}"`;if(range===false)return new Response(null,{status:416,headers:{...headers,"Content-Range":`bytes */${bytes.length}`}});if(range){headers["Content-Range"]=`bytes ${range.start}-${range.end}/${bytes.length}`;headers["Content-Length"]=String(range.end-range.start+1);return new Response(new Uint8Array(bytes.subarray(range.start,range.end+1)),{status:206,headers});}headers["Content-Length"]=String(bytes.length);return new Response(new Uint8Array(bytes),{headers});}catch{return NextResponse.json({error:"Exam resource unavailable on this server."},{status:503});}
}
