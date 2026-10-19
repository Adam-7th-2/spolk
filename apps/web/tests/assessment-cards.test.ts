import {it,expect} from "vitest";
import {resolve} from "node:path";
import {openLocalStore,demoAccounts} from "../src/lib/local-store";
import {localRpc} from "../src/lib/local-query";
import {lessonGuidance} from "../src/lib/lesson-guidance";
import book from "../src/content/traveller.json";
import {completeEarlierLessons} from './helpers/progression';

it("gives hints and full guidance for every existing lesson question",()=>{
 for(const question of book.lessons.flatMap(lesson=>lesson.questions)){
  const guidance=lessonGuidance(question.prompt,question.correct_answer);
  expect(guidance.hint.length).toBeGreaterThan(20);expect(guidance.rule.length).toBeGreaterThan(5);
  expect(guidance.explanation.length).toBeGreaterThan(55);expect(guidance.example.length).toBeGreaterThan(25);expect(guidance.commonMistake.length).toBeGreaterThan(35);
 }
 expect(lessonGuidance("I am from Spain. I am ___.","Spanish").rule).toBe("Countries and nationalities");
 expect(lessonGuidance("I ___ fine, thank you.","am").rule).toBe("Match be to the subject");
});
it("reveals feedback only after an owned answer is frozen and preserves server grading",async()=>{
 const store=await openLocalStore("memory://",resolve("../.."));
 const student=demoAccounts[0].id,quiz="d1000000-0000-4000-8000-000000000005",first="d1000000-0000-4000-8000-000000000011",second="d1000000-0000-4000-8000-000000000012";
 try{
  await completeEarlierLessons(store.db,student,'d1000000-0000-4000-8000-000000000002');
  const start=await localRpc(store,student,"start_assessment",{aid:quiz});expect(start.error).toBeNull();
  const attempt=(start.data as {attemptId:string}).attemptId;
  const initial=await localRpc(store,student,"assessment_practice_review",{attempt_id:attempt});
  expect((initial.data as {answers:unknown[]}).answers).toEqual([]);
  const wrong=await localRpc(store,student,"answer_assessment_question",{attempt_id:attempt,question_id:first,response:"Good night."});
  expect(wrong.error).toBeNull();expect(wrong.data).toMatchObject({correct:false,correctAnswer:"Hello, my name is Alex."});
  const changed=await localRpc(store,student,"answer_assessment_question",{attempt_id:attempt,question_id:first,response:"Hello, my name is Alex."});
  expect(changed.data).toMatchObject({selected:"Good night.",correct:false});
  const outsider=await localRpc(store,demoAccounts[1].id,"assessment_practice_review",{attempt_id:attempt});
  expect(outsider.error?.code).toBe("42501");
  const alienQuestion=await localRpc(store,student,"answer_assessment_question",{attempt_id:attempt,question_id:"00000000-0000-4000-8000-000000000000",response:"hidden"});
  expect(alienQuestion.error).not.toBeNull();
  await localRpc(store,student,"answer_assessment_question",{attempt_id:attempt,question_id:second,response:"meet"});
  const saved=await localRpc(store,student,"submit_assessment",{attempt_id:attempt,responses:{[first]:"Hello, my name is Alex.",[second]:"meet"}});
  expect(Number(saved.data)).toBe(50);
  const review=await localRpc(store,student,"assessment_practice_review",{attempt_id:attempt});
  expect((review.data as {answers:unknown[]}).answers).toHaveLength(2);
  const expired=await localRpc(store,student,"start_assessment",{aid:quiz});
  const expiredId=(expired.data as {attemptId:string}).attemptId;
  await store.db.query("update public.assessment_attempts set started_at=now()-interval '1 hour' where id=$1",[expiredId]);
  expect((await localRpc(store,student,"answer_assessment_question",{attempt_id:expiredId,question_id:first,response:"Hello, my name is Alex."})).error).not.toBeNull();
  expect(Number((await localRpc(store,student,"submit_assessment",{attempt_id:expiredId,responses:{}})).data)).toBe(0);
 }finally{await store.db.close();}
},60000);
