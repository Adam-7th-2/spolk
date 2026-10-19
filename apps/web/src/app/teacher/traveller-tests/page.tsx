export const dynamic="force-dynamic";
import Link from "next/link";
import {notFound} from "next/navigation";
import {requireRole} from "@/lib/access";
import {examManifest} from "@/lib/traveller-exams";
import {ExamResources} from "@/components/exam-resources";
export default async function TravellerTests(){
 const{db}=await requireRole(["teacher","admin","super_admin"]);
 const[{data:admin},{data:source}]=await Promise.all([db.rpc("is_admin"),db.from("book_sources").select("course_id").eq("id","traveller-beginners").maybeSingle()]);
 if(!admin){if(!source)notFound();const{data:assigned}=await db.rpc("teaches",{cid:source.course_id});if(!assigned)notFound();}
 const{data:schedule}=await db.from("traveller_exams").select("id,lesson_id,opens_at,closes_at,minutes");
 return <section className="section page-section"><Link className="text-link" href="/teacher">← Teaching workspace</Link><div className="eyebrow" style={{marginTop:25}}>PRIVATE COURSE TEST LIBRARY</div><h1>Tests, audio & answers.</h1><p className="lead">Every original module test, mid-term and final has its own paper, editable Word document, matching MP3, answer key and listening transcript. Student access to papers and audio still follows the timed exam schedule.</p><nav className="pills" aria-label="Choose a test">{examManifest.exams.map(e=><a className="text-link" key={e.id} href={`#${e.id}`}>{e.title}</a>)}</nav>{examManifest.exams.map(e=>{const current=schedule?.find(s=>s.id===e.id);return <article className="dashboard-card" id={e.id} key={e.id} style={{marginTop:25}}><div className="eyebrow">WEEK {e.week}</div><h2>{e.title}</h2><p>{e.maxMarks} original marks · {current?.minutes||e.minutes} minutes · paper pages {e.sourcePages.join(", ")}</p>{current?<p>{new Date(current.opens_at).toISOString().slice(0,16).replace("T"," ")} to {new Date(current.closes_at).toISOString().slice(0,16).replace("T"," ")} UTC · <Link className="text-link" href={`/learn/${current.lesson_id}`}>Open course exam →</Link></p>:<p className="status">Not scheduled yet. An administrator can add this exam to the course from <Link href="/admin/courses/traveller/exams">exam scheduling</Link>.</p>}<ExamResources examId={e.id} staff/></article>})}</section>;
}
