import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
import {readHomeworkFile} from "@/lib/homework-files";
export const runtime='nodejs';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 if(!await currentUser())return new NextResponse('Sign in first',{status:401});
 const{id}=await params;if(!z.uuid().safeParse(id).success)return new NextResponse('Not found',{status:404});
 const db=await database();const{data:file,error}=await db.from('submission_files').select('id,original_name,mime_type').eq('id',id).maybeSingle();
 if(error||!file)return new NextResponse('Not found',{status:404});
 try{const bytes=await readHomeworkFile(id);return new NextResponse(bytes,{headers:{'Content-Type':file.mime_type,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return new NextResponse('File unavailable',{status:404});}
}
