import {NextResponse} from "next/server";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
export async function POST(req:Request){if(req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});const user=await currentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const p=z.object({transcript:z.string().min(1).max(20000),mode:z.literal("course-practice")}).safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:"Invalid practice session"},{status:400});const db=await database();const{error}=await db.from("speaking_sessions").insert({...p.data,account_id:user.id});return NextResponse.json({saved:!error},{status:error?503:200});}
