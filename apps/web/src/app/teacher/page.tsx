export const dynamic = "force-dynamic";
import { requireRole } from "@/lib/access";
import { TeacherCurriculum } from "@/components/teacher-curriculum";
import { TeacherGrading } from "@/components/teacher-grading";

export default async function Teacher() {
 const { db } = await requireRole(["teacher", "admin", "super_admin"]);
 const [modules, submissions, assignments, lessons, courses, grades] = await Promise.all([
  db.from("modules").select("id,course_id,title"),
  db.from("submissions").select("id,assignment_id,account_id,body,submitted_at").order("submitted_at", { ascending: false }).limit(30),
  db.from("assignments").select("id,title"),
  db.from("lessons").select("id,module_id,title").order("position"),
  db.from("courses").select("id,title"),
  db.from("grades").select("submission_id,score,feedback"),
 ]);
 if ([modules, submissions, assignments, lessons, courses, grades].some(result => result.error)) throw new Error("Unable to load teaching records.");
 return <section className="section page-section">
  <div className="eyebrow">TEACHER WORKSPACE</div>
  <h1>Help the next chapter happen.</h1>
  <div className="detail-grid">
   <div><TeacherCurriculum courses={courses.data || []} modules={modules.data || []} lessons={lessons.data || []} /></div>
   <div><TeacherGrading submissions={submissions.data || []} assignments={assignments.data || []} grades={grades.data || []} /></div>
  </div>
 </section>;
}
