import type {AcademyDatabase} from './supabase';
export type GradeRow={id:string;title:string;course:string;lessonId:string|null;kind:'assignment'|'exam'|'quiz';score:number|null;passed:boolean|null;feedback:string;date:string};
export function gradeSummary(rows:GradeRow[]){
 const marked=rows.filter(r=>r.kind!=='quiz'&&r.score!==null);
 return {graded:marked.length,pending:rows.filter(r=>r.kind!=='quiz'&&r.score===null).length,average:marked.length?Math.round(marked.reduce((sum,r)=>sum+(r.score??0),0)/marked.length):null,quizzes:rows.filter(r=>r.kind==='quiz').length};
}
export async function loadGradebook(db:AcademyDatabase,accountId:string){
 const[submissions,attempts]=await Promise.all([
  db.from('submissions').select('id,assignment_id,submitted_at').eq('account_id',accountId).order('submitted_at',{ascending:false}),
  db.from('assessment_attempts').select('id,assessment_id,score,submitted_at').eq('account_id',accountId).not('submitted_at','is',null).order('submitted_at',{ascending:false}),
 ]);
 if(submissions.error||attempts.error)return {rows:[] as GradeRow[],error:true};
 const submissionIds=(submissions.data||[]).map(s=>s.id),assignmentIds=[...new Set((submissions.data||[]).map(s=>s.assignment_id))],assessmentIds=[...new Set((attempts.data||[]).map(a=>a.assessment_id))];
 const[grades,assignments,assessments,courses,exams]=await Promise.all([
  submissionIds.length?db.from('grades').select('submission_id,score,feedback,graded_at').in('submission_id',submissionIds):Promise.resolve({data:[],error:null}),
  assignmentIds.length?db.from('assignments').select('id,title,course_id,lesson_id').in('id',assignmentIds):Promise.resolve({data:[],error:null}),
  assessmentIds.length?db.from('assessments').select('id,title,course_id,lesson_id,passing_score').in('id',assessmentIds):Promise.resolve({data:[],error:null}),
  db.from('courses').select('id,title'),db.from('traveller_exams').select('assignment_id'),
 ]);
 const rows:GradeRow[]=(submissions.data||[]).map(s=>{
  const a=assignments.data?.find(a=>a.id===s.assignment_id),g=grades.data?.find(g=>g.submission_id===s.id);
  return {id:s.id,title:a?.title||'Submitted work',course:courses.data?.find(c=>c.id===a?.course_id)?.title||'Course',lessonId:a?.lesson_id||null,kind:exams.data?.some(e=>e.assignment_id===s.assignment_id)?'exam':'assignment',score:g?Number(g.score):null,passed:null,feedback:g?.feedback||'',date:g?.graded_at||s.submitted_at};
 });
 for(const attempt of attempts.data||[]){const a=assessments.data?.find(a=>a.id===attempt.assessment_id);rows.push({id:attempt.id,title:a?.title||'Quiz attempt',course:courses.data?.find(c=>c.id===a?.course_id)?.title||'Course',lessonId:a?.lesson_id||null,kind:'quiz',score:attempt.score===null?null:Number(attempt.score),passed:a&&attempt.score!==null?Number(attempt.score)>=Number(a.passing_score):null,feedback:'',date:attempt.submitted_at!});}
 rows.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
 return {rows,error:[grades,assignments,assessments,courses,exams].some(r=>r.error)};
}
