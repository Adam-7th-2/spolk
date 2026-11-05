export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loadActor } from "@/lib/actor";
import { database } from "@/lib/supabase";
import { workspaceHome } from "@/lib/workspaces";
import { formatWhen } from "@/lib/local-time";

type Progress = { id: string; course_id: string; total: number; completed: number };

export default async function Dashboard() {
 const actor = await loadActor();
 if (!actor) redirect("/login");
 const home = workspaceHome(actor.roles);
 if (home !== "/dashboard") redirect(home);
 const db = await database();
 const [enrollments, courses, sessions, notifications, lessonCatalog] = await Promise.all([
  db.from("course_enrollments").select("course_id,status").eq("account_id", actor.id).eq("status", "active"),
  db.from("courses").select("id,title"),
  db.from("live_sessions").select("id,title,starts_at").is("cancelled_at", null).gt("ends_at", new Date().toISOString()).order("starts_at").limit(1),
  db.from("notifications").select("id,body,read_at").eq("account_id", actor.id).is("read_at", null).order("created_at", { ascending: false }).limit(1),
  db.rpc("my_course_progress"),
 ]);
 const progress = ((lessonCatalog.data || []) as Progress[]).map(course => ({
  ...course,
  title: courses.data?.find(item => item.id === course.course_id)?.title || "Your course",
  percent: course.total ? Math.round(course.completed / course.total * 100) : 0,
 }));
 const next = progress.find(course => course.percent < 100) || progress[0];
 const deadline = sessions.data?.[0];
 const notice = notifications.data?.[0];
 return <section className="section page-section">
  <div className="eyebrow">YOUR SPACE TO GROW</div>
  <h1>{actor.firstName ? `Hi, ${actor.firstName}.` : "Hi there."}</h1>
  <p>One next step. The rest of your record lives in Grades, Schedule, and Messages.</p>
  {(enrollments.error || courses.error || sessions.error || notifications.error || lessonCatalog.error) && <p role="alert" className="status error">Some learning records could not be loaded. Please refresh.</p>}
  <article className="dashboard-card">
   <h2>Continue learning</h2>
   {next ? <>
    <div className="progress-course-heading"><strong>{next.title}</strong><span>{next.percent}%</span></div>
    <div className="progress-track"><span style={{ width: `${next.percent}%` }} /></div>
    <small>{next.completed} of {next.total} lessons complete</small>
    <p><Link className="button" href={`/dashboard/courses/${next.course_id}`}>Continue course →</Link></p>
   </> : <p>Enroll in Traveller Beginners to start your next lesson. <Link className="text-link" href="/courses">See open courses →</Link></p>}
  </article>
  <article className="dashboard-card">
   <h2>Next deadline</h2>
   {deadline ? <p><Link className="text-link" href={`/classroom/${deadline.id}`}>{deadline.title} →</Link><br /><small>{formatWhen(deadline.starts_at, actor.timezone)}</small></p> : <p>No upcoming class. <Link className="text-link" href="/dashboard/schedule">Open your schedule →</Link></p>}
  </article>
  <article className="dashboard-card">
   <h2>Unread notice</h2>
   {notice ? <p>{notice.body}</p> : <p>You’re all caught up.</p>}
   <p><Link className="text-link" href="/workspace/notifications">All notifications →</Link></p>
  </article>
 </section>;
}
