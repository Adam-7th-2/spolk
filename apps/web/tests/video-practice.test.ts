import {it,expect} from "vitest";
import {videoPractice} from "../src/content/video-practice";
import {travellerVideos} from "../src/lib/traveller-videos";
import {initialPractice,practiceDuration,practiceReducer,prepareVideoQuestions} from "../src/lib/video-practice";

const videoId="31y2Bq1RYQA";
const started=()=>practiceReducer(initialPractice,{type:"start",videoId,videoSeconds:302,now:10000});
it("provides five original questions with hints and explanations for every video",()=>{
 const ids=[...new Set(travellerVideos.videos.map(video=>video.videoId))];
 expect(Object.keys(videoPractice).sort()).toEqual(ids.sort());
 for(const id of ids){
  const questions=prepareVideoQuestions(id,()=>.4);
  expect(questions).toHaveLength(5);
  expect(new Set(questions.map(q=>q.prompt)).size).toBe(5);
  for(const [index,q] of questions.entries()){
   expect(new Set(q.options).size).toBe(4);
   expect(q.options[q.answer]).toBe(videoPractice[id][index].correct);
   expect(q.hint.length).toBeGreaterThan(15);expect(q.explanation.length).toBeGreaterThan(30);
  }
 }
});
it("estimates bounded practice time from the video duration",()=>{
 expect(practiceDuration(36)).toBe(180);expect(practiceDuration(302)).toBe(240);
 expect(practiceDuration(9999)).toBe(420);expect(practiceDuration(NaN)).toBe(180);
});
it("waits for Start, locks checked answers and explains mistakes before Next",()=>{
 expect(practiceReducer(initialPractice,{type:"tick",now:99999999})).toBe(initialPractice);
 let state=started();
 expect(practiceReducer(state,{type:"check",now:11000})).toBe(state);
 state=practiceReducer(state,{type:"hint"});
 const wrong=(state.questions[0].answer+1)%4;
 state=practiceReducer(state,{type:"select",option:wrong});
 state=practiceReducer(state,{type:"check",now:11000});
 expect(state.phase).toBe("feedback");expect(state.answers[0]).toEqual({selected:wrong,correct:false,usedHint:true});
 expect(practiceReducer(state,{type:"select",option:state.questions[0].answer})).toBe(state);
 state=practiceReducer(state,{type:"next",now:12000});
 expect(state.index).toBe(1);expect(state.hint).toBe(false);expect(state.selected).toBeNull();
});
it("keeps counting down during feedback and catches up after an inactive tab",()=>{
 let state=started();
 state=practiceReducer(state,{type:"select",option:state.questions[0].answer});
 state=practiceReducer(state,{type:"check",now:11000});
 state=practiceReducer(state,{type:"tick",now:40000});
 expect(state.remaining).toBe(210);
 state=practiceReducer(state,{type:"tick",now:state.deadline+5000});
 expect(state.phase).toBe("result");expect(state.remaining).toBe(0);expect(state.expired).toBe(true);
 expect(state.answers.filter(answer=>answer.correct)).toHaveLength(1);
 expect(practiceReducer(state,{type:"next",now:state.deadline+6000})).toBe(state);
});
it("rejects a late answer even if the visual timer has not ticked yet",()=>{
 let state=started();state=practiceReducer(state,{type:"select",option:state.questions[0].answer});
 state=practiceReducer(state,{type:"check",now:state.deadline});
 expect(state.phase).toBe("result");expect(state.answers).toHaveLength(0);
});
it("finishes exactly five cards and starts a fresh attempt on retry",()=>{
 let state=started();
 for(let i=0;i<5;i++){
  state=practiceReducer(state,{type:"select",option:state.questions[i].answer});
  state=practiceReducer(state,{type:"check",now:11000+i*1000});
  expect(state.answers).toHaveLength(i+1);
  state=practiceReducer(state,{type:"next",now:11500+i*1000});
 }
 expect(state.phase).toBe("result");expect(state.answers.every(answer=>answer.correct)).toBe(true);
 state=practiceReducer(state,{type:"start",videoId,videoSeconds:302,now:20000});
 expect(state.answers).toEqual([]);expect(state.index).toBe(0);expect(state.remaining).toBe(240);
});
