import {NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(_:Request,{params}:{params:Promise<{page:string}>}){
 if(!await currentUser())return NextResponse.json({error:"Unauthorized"},{status:401});const db=await database();const{data:admin}=await db.rpc("is_admin");if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 const page=z.coerce.number().int().min(1).max(126).safeParse((await params).page);if(!page.success)return NextResponse.json({error:"Invalid page"},{status:400});
 try{const bytes=await readFile(resolve(process.cwd(),"private/books/traveller/pages",`${String(page.data).padStart(3,"0")}.jpg`));return new Response(new Uint8Array(bytes),{headers:{"Content-Type":"image/jpeg","Cache-Control":"private, no-store"}});}catch{return NextResponse.json({error:"Source asset unavailable"},{status:503});}
}
