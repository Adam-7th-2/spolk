import {currentUser,database} from "@/lib/supabase";

export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(!origin||origin!==new URL(request.url).origin)return Response.json({error:"Invalid request origin."},{status:403});
 if(!await currentUser())return Response.json({error:"Sign in first."},{status:401});
 const db=await database();const{data,error}=await db.rpc("daily_checkin");
 if(error)return Response.json({error:"Daily check-in is temporarily unavailable. Your course progress is safe."},{status:503});
 return Response.json(data,{headers:{"Cache-Control":"private, no-store"}});
}
