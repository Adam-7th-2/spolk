import {requireUser} from "@/lib/access";
import {database} from "@/lib/supabase";
import {notFound} from "next/navigation";
import {Classroom} from "@/components/classroom";
export const dynamic="force-dynamic";
export default async function ClassPage({params}:{params:Promise<{id:string}>}){await requireUser();const{id}=await params;const db=await database();const{data}=await db.from("live_sessions").select("id,title").eq("id",id).maybeSingle();if(!data)notFound();return <section className="section page-section"><div className="eyebrow">YOUR SPACE TO CONNECT</div><h1>{data.title}</h1><Classroom sessionId={id}/></section>}
