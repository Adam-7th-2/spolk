export const dynamic = "force-dynamic";
import {ApplicationForm} from "@/components/application-form";
import {currentUser} from "@/lib/supabase";
export default async function Apply({searchParams}:{searchParams:Promise<{course?:string}>}){const query=await searchParams;const user=await currentUser();return <section className="section page-section"><ApplicationForm course={query.course||"everyday-english"} signedIn={Boolean(user)}/></section>}
