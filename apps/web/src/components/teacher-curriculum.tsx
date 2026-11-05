import Link from "next/link";
import { ActionForm } from "./action-form";
import { createLesson, postCourseAnnouncement } from "@/app/workspace/actions";

type Course = { id: string; title: string };
type Module = { id: string; course_id: string; title: string };
type Lesson = { id: string; module_id: string; title: string };

export function TeacherCurriculum({ courses, modules, lessons }: { courses: Course[]; modules: Module[]; lessons: Lesson[] }) {
 const taught = courses.filter(course => modules.some(module => module.course_id === course.id));
 return <article className="dashboard-card">
  <h2>Assigned curriculum</h2>
  <p><Link className="text-link" href="/teacher/traveller-tests">Traveller tests, audio and answers →</Link></p>
  <details className="ask-teacher">
   <summary>Post a course update<span>+</span></summary>
   <ActionForm action={postCourseAnnouncement} label="Notify students">
    <label>Course<select name="course_id" required>{taught.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
    <label>Course update<textarea name="body" required minLength={5} maxLength={5000} /></label>
   </ActionForm>
  </details>
  {modules.map(module => <div className="dashboard-card" key={module.id}>
   <h3>{courses.find(course => course.id === module.course_id)?.title}</h3>
   <p>{module.title}</p>
   {lessons.filter(lesson => lesson.module_id === module.id).map(lesson => <p key={lesson.id}><Link className="text-link" href={`/learn/${lesson.id}`}>{lesson.title} →</Link></p>)}
   <details>
    <summary>Create a lesson in this module</summary>
    <ActionForm action={createLesson} label="Create lesson">
     <input type="hidden" name="course_id" value={module.course_id} />
     <input type="hidden" name="module_id" value={module.id} />
     <label>Lesson title<input name="title" required minLength={3} /></label>
     <label>Lesson content<textarea name="body" required minLength={10} /></label>
     <label>Position in module<input name="position" type="number" min={0} required /></label>
     <label>Release time<input name="released_at" type="datetime-local" required /></label>
     <p className="fine">Saved in your profile time zone.</p>
    </ActionForm>
   </details>
  </div>)}
  {!modules.length && <p>No assigned course modules yet.</p>}
 </article>;
}
