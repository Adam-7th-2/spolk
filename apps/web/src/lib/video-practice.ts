import {videoPractice} from "../content/video-practice";

export type PracticeQuestion={id:string;prompt:string;options:string[];answer:number;hint:string;explanation:string};
export type PracticeAnswer={selected:number;correct:boolean;usedHint:boolean};
export type PracticeState={phase:"intro"|"question"|"feedback"|"result";questions:PracticeQuestion[];index:number;selected:number|null;hint:boolean;answers:PracticeAnswer[];duration:number;deadline:number;remaining:number;expired:boolean};
export const initialPractice:PracticeState={phase:"intro",questions:[],index:0,selected:null,hint:false,answers:[],duration:0,deadline:0,remaining:0,expired:false};
export type PracticeAction={type:"start";videoId:string;videoSeconds:number;now:number}|{type:"select";option:number}|{type:"hint"}|{type:"check"|"next"|"tick";now:number}|{type:"reset"};

export function practiceDuration(videoSeconds:number){return Math.max(180,Math.min(420,Math.ceil((Number.isFinite(videoSeconds)?videoSeconds:180)*.7/30)*30));}
export function prepareVideoQuestions(videoId:string,random:()=>number=Math.random):PracticeQuestion[]{
 return (videoPractice[videoId]||[]).map((question,index)=>{
  const options=[question.correct,...question.distractors];
  for(let i=options.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
  return {id:`${videoId}-${index+1}`,prompt:question.prompt,options,answer:options.indexOf(question.correct),hint:question.hint,explanation:question.explanation};
 });
}
export function practiceReducer(state:PracticeState,action:PracticeAction):PracticeState{
 if(action.type==="reset")return initialPractice;
 if(action.type==="start"){
  const questions=prepareVideoQuestions(action.videoId),duration=practiceDuration(action.videoSeconds);
  if(questions.length!==5)return state;
  return {...initialPractice,phase:"question",questions,duration,deadline:action.now+duration*1000,remaining:duration};
 }
 if(state.phase==="intro"||state.phase==="result")return state;
 if("now" in action&&action.now>=state.deadline)return {...state,phase:"result",remaining:0,expired:true};
 if(action.type==="tick"){
  const remaining=Math.max(0,Math.ceil((state.deadline-action.now)/1000));
  return remaining===state.remaining?state:{...state,remaining};
 }
 if(action.type==="select"&&state.phase==="question"&&Number.isInteger(action.option)&&action.option>=0&&action.option<state.questions[state.index].options.length)return {...state,selected:action.option};
 if(action.type==="hint"&&state.phase==="question")return {...state,hint:true};
 if(action.type==="check"&&state.phase==="question"&&state.selected!==null)return {...state,phase:"feedback",answers:[...state.answers,{selected:state.selected,correct:state.selected===state.questions[state.index].answer,usedHint:state.hint}]};
 if(action.type==="next"&&state.phase==="feedback")return state.index===state.questions.length-1?{...state,phase:"result"}:{...state,phase:"question",index:state.index+1,selected:null,hint:false};
 return state;
}
