import {NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(_:Request,{params}:{params:Promise<{lessonId:string}>}){
 if(!await currentUser())return NextResponse.json({error:"Sign in to open lesson pages."},{status:401});
 const p=z.object({lessonId:z.uuid()}).safeParse(await params);if(!p.success)return NextResponse.json({error:"Invalid lesson."},{status:400});
 const db=await database();const{data,error}=await db.from("book_lesson_details").select("book_id").eq("lesson_id",p.data.lessonId).maybeSingle();
 if(error||!data||data.book_id!=="traveller-beginners")return NextResponse.json({error:"This lesson is not available to your account."},{status:403});
 try{const bytes=await readFile(resolve(process.cwd(),"private/books/traveller/lessons",`${p.data.lessonId}.pdf`));return new Response(new Uint8Array(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":'inline; filename="traveller-lesson.pdf"',"Cache-Control":"private, no-store"}});}catch{return NextResponse.json({error:"Original lesson PDF is unavailable on this server."},{status:503});}
}
