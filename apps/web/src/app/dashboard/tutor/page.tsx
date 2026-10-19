import {requireUser} from "@/lib/access";
import {database} from "@/lib/supabase";
import {Tutor} from "@/components/tutor";
export const dynamic="force-dynamic";
export default async function TutorPage(){await requireUser();const db=await database();const{data}=await db.from("courses").select("id,title");const enrolled=[];for(const c of data||[]){const{data:ok}=await db.rpc("enrolled",{cid:c.id});if(ok)enrolled.push(c);}return <section className="section page-section"><div className="eyebrow">COURSE STUDY SUPPORT</div><h1>A question is progress.</h1><Tutor courses={enrolled}/></section>}
