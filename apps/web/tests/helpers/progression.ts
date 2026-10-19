import type {PGlite} from '@electric-sql/pglite';
// Isolated test fixtures model a learner who already completed earlier course material.
// Runtime code never uses this helper or fabricates progress.
export async function completeEarlierLessons(db:PGlite,student:string,lessonId:string){
 await db.exec('reset role');
 await db.query(`insert into public.lesson_progress(account_id,lesson_id)
 select $1,earlier.id from public.lessons target join public.modules tm on tm.id=target.module_id
 join public.lessons earlier on earlier.course_id=target.course_id join public.modules em on em.id=earlier.module_id
 where target.id=$2 and (em.position,earlier.position,earlier.id)<(tm.position,target.position,target.id)
 and not exists(select 1 from public.book_lesson_details b where b.lesson_id=earlier.id and b.kind in ('reference','exam')) on conflict do nothing`,[student,lessonId]);
}
