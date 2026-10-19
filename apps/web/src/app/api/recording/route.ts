import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
export async function POST(req:Request){if(req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});if(!await currentUser())return NextResponse.json({error:"Unauthorized"},{status:401});const p=z.object({sessionId:z.uuid()}).safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:"Invalid session"},{status:400});const db=await database();const{data,error}=await db.rpc("recording_authorized",{sid:p.data.sessionId});return NextResponse.json({allowed:!error&&data===true},{status:!error&&data===true?200:403,headers:{"Cache-Control":"no-store"}});}
