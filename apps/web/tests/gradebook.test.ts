import {beforeAll,afterAll,it,expect} from 'vitest';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {gradeSummary,loadGradebook,type GradeRow} from '../src/lib/gradebook';
import {openLocalStore,demoAccounts} from '../src/lib/local-store';
import {LocalQuery} from '../src/lib/local-query';
import type {AcademyDatabase} from '../src/lib/supabase';
let store:Awaited<ReturnType<typeof openLocalStore>>;
const student=demoAccounts[0].id,admin=demoAccounts[2].id;
let own:string,other:string;
beforeAll(async()=>{
 store=await openLocalStore('memory://',resolve('../..'));own=randomUUID();other=randomUUID();
 const assignments=(await store.db.query<{id:string}>('select id from public.assignments order by id limit 2')).rows;
 await store.db.query('insert into public.submissions(id,assignment_id,account_id,body) values($1,$2,$3,$4),($5,$6,$7,$8)',[own,assignments[0].id,student,'Own work',other,assignments[1].id,admin,'Other account work']);
 await store.db.query('insert into public.grades(submission_id,grader_id,score,feedback) values($1,$2,85,$3),($4,$2,10,$5)',[own,admin,'Good work.',other,'Private other feedback']);
},60000);
afterAll(async()=>{await store?.db.close();});
it('shows only the requested learner’s scores and excludes another account’s feedback',async()=>{
 const db={from:(table:string)=>new LocalQuery(store,student,table)} as unknown as AcademyDatabase;
 const result=await loadGradebook(db,student);expect(result.error).toBe(false);
 expect(result.rows.find(r=>r.id===own)).toMatchObject({score:85,feedback:'Good work.'});
 expect(result.rows.some(r=>r.id===other)).toBe(false);expect(JSON.stringify(result)).not.toContain('Private other feedback');
});
it('does not turn pending work into zero or mix repeated quiz attempts into the average',()=>{
 const row={id:'1',title:'Work',course:'English',lessonId:null,kind:'assignment',score:80,passed:null,feedback:'',date:'2026-10-19'} as GradeRow;
 expect(gradeSummary([row,{...row,id:'2',score:null},{...row,id:'3',kind:'quiz',score:0}])).toEqual({graded:1,pending:1,average:80,quizzes:1});
 expect(gradeSummary([]).average).toBeNull();
});
