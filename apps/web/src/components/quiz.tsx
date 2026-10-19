"use client";
import {useCallback,useEffect,useId,useRef,useState,type CSSProperties} from "react";
import {ArrowRight,Check,CheckCircle2,Clock3,Lightbulb,RotateCcw,Sparkles,Trophy,XCircle} from "lucide-react";
import type {LessonGuidance} from "../lib/lesson-guidance";
import {DetailedExplanation} from "./detailed-explanation";
import {clipTime} from "../lib/traveller-video-clips";

type Feedback=LessonGuidance&{id:string;prompt:string;selected:string|null;correctAnswer:string;correct:boolean};
type QuizData={attemptId:string;deadline:string;answered:Feedback[];questions:{id:string;kind:string;prompt:string;options:string[];hint:string}[]};
type Result={score:number;answers:Feedback[];expired:boolean};
async function call(body:object){
 const response=await fetch("/api/assessment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 const data=await response.json();if(!response.ok)throw new Error(data.error||"Assessment unavailable");return data;
}
const secondsLeft=(deadline:string)=>Math.max(0,Math.ceil((Date.parse(deadline)-Date.now())/1000));
export function Quiz({assessmentId,title}:{assessmentId:string;title:string}){
 const[data,setData]=useState<QuizData|null>(null),[result,setResult]=useState<Result|null>(null);
 const[index,setIndex]=useState(0),[selection,setSelection]=useState(""),[hint,setHint]=useState(false);
 const[status,setStatus]=useState(""),[busy,setBusy]=useState(false),[remaining,setRemaining]=useState(0);
 const lock=useRef(false),autoSubmitted=useRef(false),card=useRef<HTMLDivElement>(null),feedbackRef=useRef<HTMLDivElement>(null);
 const id=useId(),question=data?.questions[index],feedback=data?.answered.find(answer=>answer.id===question?.id);
 const hasData=Boolean(data),hasResult=Boolean(result),feedbackId=feedback?.id;
 const finish=useCallback(async()=>{
  if(!data||lock.current)return;
  lock.current=true;setBusy(true);setStatus("");
  try{const saved=await call({action:"submit",attemptId:data.attemptId,responses:{}});setResult({...saved,score:Number(saved.score)});setData(null);}
  catch(error){setStatus(error instanceof Error?error.message:"Your result could not be saved. Retry submission.");}
  finally{lock.current=false;setBusy(false);}
 },[data]);
 useEffect(()=>{
  if(!data)return;
  const tick=()=>{const left=secondsLeft(data.deadline);setRemaining(left);if(left===0&&!autoSubmitted.current&&!lock.current){autoSubmitted.current=true;void finish();}};
  const timer=setInterval(tick,250);document.addEventListener("visibilitychange",tick);
  return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",tick);};
 },[data,finish]);
 useEffect(()=>{
  if(!hasData&&!hasResult)return;
  const target=feedbackId?feedbackRef.current:card.current;
  target?.focus({preventScroll:true});target?.scrollIntoView({block:"nearest",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
 },[index,hasData,hasResult,feedbackId]);
 async function start(){
  if(lock.current)return;lock.current=true;setBusy(true);setStatus("");setResult(null);
  try{
   const started:QuizData=await call({action:"start",assessmentId});
   const first=started.questions.findIndex(q=>!started.answered.some(a=>a.id===q.id));
   setIndex(first<0?Math.max(0,started.questions.length-1):first);setSelection("");setHint(false);
   setRemaining(secondsLeft(started.deadline));autoSubmitted.current=false;setData(started);
  }catch(error){setStatus(error instanceof Error?error.message:"Assessment unavailable");}
  finally{lock.current=false;setBusy(false);}
 }
 async function check(){
  if(!data||!question||!selection.trim()||lock.current)return;
  if(secondsLeft(data.deadline)===0){void finish();return;}
  lock.current=true;setBusy(true);setStatus("");
  try{
   const answer:Feedback=await call({action:"answer",attemptId:data.attemptId,questionId:question.id,response:selection});
   setData({...data,answered:[...data.answered.filter(item=>item.id!==answer.id),answer]});
  }catch(error){setStatus(error instanceof Error?error.message:"Your answer could not be saved. Please try again.");}
  finally{lock.current=false;setBusy(false);}
 }
 function next(){setIndex(i=>i+1);setSelection("");setHint(false);}
 return <article className="video-quiz assessment-quiz" aria-labelledby={id}>
  <div className="video-quiz-heading"><span className="eyebrow"><Sparkles size={15} aria-hidden="true"/> PRACTISE WHAT YOU LEARNED</span><span className="video-quiz-tag">Lesson practice</span></div><h3 id={id}>{title}</h3>
  {!data&&!result&&<div className="video-quiz-intro"><p>Work through the lesson’s questions one card at a time. Check each answer to see the rule, a worked example, and a common mistake.</p><div className="video-quiz-facts"><span><Clock3 size={17} aria-hidden="true"/>Timed practice</span><span><Lightbulb size={17} aria-hidden="true"/>Hints and detailed explanations</span><span><CheckCircle2 size={17} aria-hidden="true"/>Progress saved as you answer</span></div><button type="button" className="button" onClick={start} disabled={busy}>{busy?"Preparing…":"Start practice quiz"}<ArrowRight size={17} aria-hidden="true"/></button><p className="fine">Your countdown starts with your attempt. Checked answers stay saved when you return; they cannot be changed after feedback.</p></div>}
  {data&&<><div className="video-quiz-toolbar"><span>Question {index+1} of {data.questions.length}</span><div className={`video-quiz-clock ${remaining<=30?"urgent":""}`} role="timer" aria-label="Time remaining" aria-live="off"><Clock3 size={17} aria-hidden="true"/>{clipTime(remaining)}</div></div><div className="video-quiz-progress" role="progressbar" aria-label="Questions answered" aria-valuenow={data.answered.length} aria-valuemin={0} aria-valuemax={data.questions.length}><span style={{width:`${data.answered.length/Math.max(1,data.questions.length)*100}%`}}/></div>
   {question&&<div className="video-quiz-card" ref={card} tabIndex={-1} key={question.id}><div className="video-quiz-question-label">QUESTION {String(index+1).padStart(2,"0")}</div><h4 id={`${id}-question`}>{question.prompt}</h4>
    <fieldset className="video-quiz-options" aria-labelledby={`${id}-question`} disabled={Boolean(feedback)||busy||remaining===0}><legend className="sr-only">Your answer</legend>
     {question.kind==="multiple_choice"?question.options.map((option,optionIndex)=>{
      const checked=(feedback?.selected??selection)===option,isCorrect=feedback?.correctAnswer===option,isWrong=Boolean(feedback)&&checked&&!isCorrect;
      return <label className={`video-quiz-option ${checked?"selected":""} ${isCorrect?"correct":""} ${isWrong?"incorrect":""}`} key={option}><input type="radio" name={`${id}-choice`} checked={checked} onChange={()=>setSelection(option)}/><span className="video-quiz-letter" aria-hidden="true">{String.fromCharCode(65+optionIndex)}</span><span>{option}</span>{isCorrect?<CheckCircle2 size={20} aria-hidden="true"/>:isWrong?<XCircle size={20} aria-hidden="true"/>:null}</label>;
     }):<label className="assessment-short-answer">Your answer<input value={feedback?.selected??selection} maxLength={1000} onChange={event=>setSelection(event.target.value)} autoComplete="off"/></label>}
    </fieldset>
    {!feedback&&<><div className="video-quiz-actions"><button type="button" className="text-link video-quiz-hint-button" onClick={()=>setHint(true)} disabled={hint||busy||remaining===0} aria-expanded={hint}><Lightbulb size={17} aria-hidden="true"/>Show hint</button><button type="button" className="button" onClick={check} disabled={!selection.trim()||busy||remaining===0}>{busy?"Checking…":"Check answer"}<Check size={17} aria-hidden="true"/></button></div>{hint&&<p className="video-quiz-hint">{question.hint}</p>}</>}
    {feedback&&<div className={`video-quiz-feedback ${feedback.correct?"positive":"try-again"}`} ref={feedbackRef} tabIndex={-1} role="status">{feedback.correct&&<div className="video-quiz-confetti" aria-hidden="true">{Array.from({length:8},(_,piece)=><i key={piece} style={{"--piece":piece} as CSSProperties}/>)}</div>}<div className="video-quiz-feedback-title">{feedback.correct?<CheckCircle2 size={24}/>:<Lightbulb size={24}/>}<strong>{feedback.correct?"A small win. You’ve got it.":"Let’s make this clearer."}</strong></div><p><strong>Correct answer: </strong>{feedback.correctAnswer}</p><DetailedExplanation guidance={feedback}/><button type="button" className="button" disabled={busy||remaining===0} onClick={index===data.questions.length-1?()=>void finish():next}>{index===data.questions.length-1?"Finish and save result":"Next question"}<ArrowRight size={17} aria-hidden="true"/></button></div>}
   </div>}
   {remaining===0&&<div className="status" role="status">Time is up. {busy?"Saving your result…":"Your answers are locked."}{!busy&&<button type="button" className="button" onClick={()=>void finish()}>Retry submission</button>}</div>}
  </>}
  {result&&<div className="video-quiz-result" ref={card} tabIndex={-1}><div className="video-quiz-result-icon"><Trophy size={34} aria-hidden="true"/></div><span className="eyebrow">PRACTICE COMPLETE</span><h4>{result.score>=70?"Look at your progress.":"Keep going. Every try teaches you."}</h4><p className="video-quiz-result-score"><strong>{result.score}<small>%</small></strong><span>Saved assessment score</span></p>{result.expired&&<p>Your time limit expired. The assessment rules give expired attempts a score of zero.</p>}<div className="video-quiz-result-stats"><span>{result.answers.filter(answer=>answer.correct).length} correct</span><span>{result.answers.filter(answer=>!answer.correct).length} missed</span></div><div className="video-quiz-result-review">{result.answers.map((answer,i)=><details key={answer.id}><summary><span className="video-quiz-review-label">{answer.correct?<CheckCircle2 size={18}/>:<XCircle size={18}/>} {i+1}. {answer.prompt}</span><span>+</span></summary><p>Your answer: <strong>{answer.selected||"Not answered"}</strong></p><p>Correct answer: <strong>{answer.correctAnswer}</strong></p><DetailedExplanation guidance={answer}/></details>)}</div><button type="button" className="button secondary" onClick={start} disabled={busy}><RotateCcw size={17} aria-hidden="true"/>Try another attempt</button><p className="fine">Attempt limits, deadlines, and the saved score are enforced by your course.</p></div>}
  {status&&<p className="status error" role="alert">{status}</p>}
 </article>;
}
