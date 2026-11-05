import Link from "next/link";
import { ActionForm } from "./action-form";
import { AttachmentList } from "./attachment-list";
import { ExamFeedback } from "./exam-feedback";
import { examManifest } from "@/lib/traveller-exams";
import { gradeExam, gradeHomework } from "@/app/workspace/actions";

type Submission = { id: string; assignment_id: string; account_id: string; body: string };
type Assignment = { id: string; title: string };
type Grade = { submission_id: string; score: number; feedback: string };

export function TeacherGrading({ submissions, assignments, grades }: { submissions: Submission[]; assignments: Assignment[]; grades: Grade[] }) {
 return <article className="dashboard-card">
  <h2 id="grading">Homework and exams to grade</h2>
  {!submissions.length && <p>No student submissions yet. Submit the demo homework as the student, then return here.</p>}
  {submissions.map(submission => {
   const grade = grades.find(item => item.submission_id === submission.id);
   const exam = examManifest.exams.find(item => item.assignmentId === submission.assignment_id);
   return <div className="form-card" key={submission.id}>
    <h3>{assignments.find(item => item.id === submission.assignment_id)?.title || "Homework"}</h3>
    <p style={{ whiteSpace: "pre-wrap" }}>{submission.body}</p>
    <AttachmentList submissionId={submission.id} />
    {exam && <p><Link className="text-link" href={`/teacher/traveller-tests#${exam.id}`}>Open matching paper, audio and answer key →</Link></p>}
    {grade && <p className="status">Graded: {grade.score}/100 · {grade.feedback}</p>}
    {exam && <ExamFeedback examId={exam.id} accountId={submission.account_id} />}
    <ActionForm action={exam ? gradeExam : gradeHomework} label={grade ? "Update feedback" : "Save feedback"}>
     <input type="hidden" name="submission_id" value={submission.id} />
     <label>{exam ? `Original marks out of ${exam.maxMarks}` : "Score out of 100"}
      <input name={exam ? "raw_score" : "score"} type="number" step="0.01" min={0} max={exam?.maxMarks || 100} defaultValue={grade ? (exam ? Math.round(grade.score * exam.maxMarks) / 100 : grade.score) : undefined} required />
     </label>
     <label>Teacher feedback<textarea name="feedback" defaultValue={grade?.feedback} required /></label>
    </ActionForm>
   </div>;
  })}
 </article>;
}
