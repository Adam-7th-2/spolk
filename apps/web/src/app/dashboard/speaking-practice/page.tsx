import {requireUser} from "@/lib/access";
import {database} from "@/lib/supabase";
import {Speaking} from "@/components/speaking";
export const dynamic="force-dynamic";
export default async function SpeakingPage(){
 const user=await requireUser();const db=await database();const [{data},{data:roles}]=await Promise.all([db.from("courses").select("id,title"),db.from("user_roles").select("role").eq("account_id",user.id)]);const staff=roles?.some(r=>["admin","super_admin","teacher"].includes(r.role))||false;const enrolled=[];
 for(const c of data||[]){const[{data:ok},{data:teaches}]=await Promise.all([db.rpc("enrolled",{cid:c.id}),db.rpc("teaches",{cid:c.id})]);if(ok||staff&& (teaches||roles?.some(r=>["admin","super_admin"].includes(r.role)))){const{data:lessons}=await db.from("lessons").select("id,title").eq("course_id",c.id).order("position");enrolled.push({...c,lessons:lessons||[]})}}
 return <section className="section page-section"><div className="eyebrow">YOUR ENGLISH, OUT LOUD</div><h1>Find your flow.</h1>{!enrolled.length?<div className="form-card"><h2>No practice course is available yet.</h2><p>Apply for a course, or ask an administrator to enroll this account. Staff can practice courses they administer or teach.</p></div>:<Speaking courses={enrolled}/>}</section>
}
