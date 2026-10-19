import {NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(_:Request,{params}:{params:Promise<{lessonId:string;page:string}>}){
 if(!await currentUser())return NextResponse.json({error:"Sign in to view course pages."},{status:401});
 const p=z.object({lessonId:z.uuid(),page:z.coerce.number().int().min(1).max(126)}).safeParse(await params);
 if(!p.success)return NextResponse.json({error:"Invalid page."},{status:400});
 const db=await database();const{data,error}=await db.from("book_lesson_pages").select("book_id").eq("lesson_id",p.data.lessonId).eq("pdf_page",p.data.page).maybeSingle();
 if(error||!data||data.book_id!=="traveller-beginners")return NextResponse.json({error:"This page is not available to your account."},{status:403});
 try{const bytes=await readFile(resolve(process.cwd(),"private/books/traveller/pages",`${String(p.data.page).padStart(3,"0")}.jpg`));return new Response(new Uint8Array(bytes),{headers:{"Content-Type":"image/jpeg","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}catch{return NextResponse.json({error:"Original page asset is unavailable on this server."},{status:503});}
}
