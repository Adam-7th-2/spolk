import {NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {currentUser,database} from "@/lib/supabase";
import {libraryFolder} from "@/lib/traveller-library";
import {storedLibraryFile} from "@/lib/library-storage";
export const runtime="nodejs";
export async function GET(_:Request,{params}:{params:Promise<{level:string;fileId:string}>}){if(!await currentUser())return NextResponse.json({error:"Sign in first."},{status:401});const db=await database();const{data:admin}=await db.rpc("is_admin");if(!admin)return NextResponse.json({error:"Administrator access required."},{status:403});const{level,fileId}=await params;if(!libraryFolder(level))return NextResponse.json({error:"Unknown folder."},{status:404});try{const file=fileId==="source"&&level==="beginners"?{meta:{name:"Traveller-Beginners-original.pdf"},bytes:await readFile(resolve(process.cwd(),"private/books/traveller/source.pdf"))}:await storedLibraryFile(level,fileId);return new Response(new Uint8Array(file.bytes),{headers:{"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(file.meta.name)}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}catch{return NextResponse.json({error:"File not found."},{status:404});}}
