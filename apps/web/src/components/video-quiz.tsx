"use client";
import {useEffect,useId,useReducer,useRef,type CSSProperties} from "react";
import {ArrowRight,Check,CheckCircle2,Clock3,Lightbulb,RotateCcw,Sparkles,Trophy,XCircle} from "lucide-react";
import {initialPractice,practiceDuration,practiceReducer} from "../lib/video-practice";
import {clipTime} from "../lib/traveller-video-clips";
import {videoPractice} from "../content/video-practice";

export function VideoQuiz({videoId,videoSeconds,onContinue,continueLabel="Continue lesson"}:{videoId:string;videoSeconds:number;onContinue?:()=>void;continueLabel?:string}){
 const[state,dispatch]=useReducer(practiceReducer,initialPractice);
 const card=useRef<HTMLDivElement>(null),feedback=useRef<HTMLDivElement>(null);
 const id=useId();
 useEffect(()=>{
  if(state.phase!=="question"&&state.phase!=="feedback")return;
  const interval=setInterval(()=>dispatch({type:"tick",now:Date.now()}),250);
  const update=()=>dispatch({type:"tick",now:Date.now()});
  document.addEventListener("visibilitychange",update);
  return()=>{clearInterval(interval);document.removeEventListener("visibilitychange",update);};
 },[state.phase,state.deadline]);
 useEffect(()=>{
  if(state.phase==="intro")return;
  const target=state.phase==="feedback"?feedback.current:card.current;
  target?.focus({preventScroll:true});
  target?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"});
 },[state.index,state.phase]);
 if(!videoPractice[videoId])return null;
 const question=state.questions[state.index];
 const answer=state.answers[state.index];
 const correct=state.answers.filter(item=>item.correct).length;
 const hintsUsed=state.answers.filter(item=>item.usedHint).length;
 const total=5;
 const duration=practiceDuration(videoSeconds);
 const start=()=>dispatch({type:"start",videoId,videoSeconds,now:Date.now()});
 return <section className="video-quiz" aria-labelledby={`${id}-title`}>
  <div className="video-quiz-heading"><span className="eyebrow"><Sparkles size={15} aria-hidden="true"/> YOUR NEXT SMALL WIN</span><span className="video-quiz-tag">Video practice</span></div>
  <h3 id={`${id}-title`}>Turn watching into knowing.</h3>
  {state.phase==="intro"?<div className="video-quiz-intro">
   <p>Try five questions on the language in this video. Take a hint when you need one, and learn from every answer.</p>
   <div className="video-quiz-facts"><span><CheckCircle2 size={17} aria-hidden="true"/>5 multiple-choice questions</span><span><Clock3 size={17} aria-hidden="true"/>About {Math.floor(duration/60)} min{duration%60?` ${duration%60} sec`:""}</span><span><Lightbulb size={17} aria-hidden="true"/>Hints & explanations</span></div>
   <button type="button" className="button" onClick={start}>Start quiz <ArrowRight size={17} aria-hidden="true"/></button>
   <p className="fine">Your countdown begins when you start. Practice time is estimated from the video length.</p>
  </div>:<>
   <div className="video-quiz-toolbar"><span>{state.phase==="result"?"Your practice result":`Question ${state.index+1} of ${total}`}</span><div className={`video-quiz-clock ${state.remaining<=30&&state.phase!=="result"?"urgent":""}`} role="timer" aria-label="Time remaining" aria-live="off"><Clock3 size={17} aria-hidden="true"/>{clipTime(state.remaining)}</div></div>
   <div className="video-quiz-progress" role="progressbar" aria-label="Questions answered" aria-valuenow={state.answers.length} aria-valuemin={0} aria-valuemax={total}><span style={{width:`${state.answers.length/total*100}%`}}/></div>
   {state.phase!=="result"?<div className="video-quiz-card" ref={card} tabIndex={-1} key={state.index}>
    <div className="video-quiz-question-label">QUESTION {String(state.index+1).padStart(2,"0")}</div>
    <h4 id={`${id}-question`}>{question.prompt}</h4>
    <fieldset className="video-quiz-options" aria-labelledby={`${id}-question`} disabled={state.phase==="feedback"}>
     <legend className="sr-only">Choose one answer</legend>
     {question.options.map((option,index)=>{
      const checked=state.selected===index,isCorrect=state.phase==="feedback"&&index===question.answer,isWrong=state.phase==="feedback"&&checked&&index!==question.answer;
      return <label className={`video-quiz-option ${checked?"selected":""} ${isCorrect?"correct":""} ${isWrong?"incorrect":""}`} key={option}>
       <input type="radio" name={`${id}-answer`} checked={checked} onChange={()=>dispatch({type:"select",option:index})}/><span className="video-quiz-letter" aria-hidden="true">{String.fromCharCode(65+index)}</span><span>{option}</span>{isCorrect?<CheckCircle2 size={20} aria-hidden="true"/>:isWrong?<XCircle size={20} aria-hidden="true"/>:null}
      </label>;
     })}
    </fieldset>
    {state.phase==="question"&&<>
     <div className="video-quiz-actions"><button type="button" className="text-link video-quiz-hint-button" aria-expanded={state.hint} aria-controls={`${id}-hint`} disabled={state.hint} onClick={()=>dispatch({type:"hint"})}><Lightbulb size={17} aria-hidden="true"/>{state.hint?"Hint shown":"Show hint"}</button><button type="button" className="button" disabled={state.selected===null} onClick={()=>dispatch({type:"check",now:Date.now()})}>Check answer <Check size={17} aria-hidden="true"/></button></div>
     {state.hint&&<p className="video-quiz-hint" id={`${id}-hint`}><strong>A little nudge: </strong>{question.hint}</p>}
    </>}
    {state.phase==="feedback"&&<div className={`video-quiz-feedback ${answer.correct?"positive":"try-again"}`} ref={feedback} tabIndex={-1} role="status">
     {answer.correct&&<div className="video-quiz-confetti" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} style={{"--piece":i} as CSSProperties}/>)}</div>}
     <div className="video-quiz-feedback-title">{answer.correct?<><Sparkles size={24} aria-hidden="true"/><strong>That’s it! One more small win.</strong></>:<><Lightbulb size={24} aria-hidden="true"/><strong>A useful mistake. Let’s learn from it.</strong></>}</div>
     <p><strong>Correct answer: </strong>{question.options[question.answer]}</p><p>{question.explanation}</p>
     <span className="video-quiz-score">{correct} correct · {total-state.answers.length} to go</span>
     <button type="button" className="button" onClick={()=>dispatch({type:"next",now:Date.now()})}>{state.index===total-1?"See my result":"Next question"}<ArrowRight size={17} aria-hidden="true"/></button>
    </div>}
   </div>:<div className="video-quiz-result" ref={card} tabIndex={-1}>
    <div className="video-quiz-result-icon"><Trophy size={34} aria-hidden="true"/></div><span className="eyebrow">PRACTICE MILESTONE</span><h4>{correct===total?"Five out of five. Beautifully done.":correct>=3?"Look how far you've come.":"Every try is a step forward."}</h4>
    <p className="video-quiz-result-score"><strong>{correct}<small> / {total}</small></strong><span>{correct/total*100}% correct</span></p>
    <p>{state.expired?"Time's up. Your checked answers are included below; unanswered questions count as missed.":"Your video practice is complete. Review your answers, then keep your learning going."}</p>
    <div className="video-quiz-result-stats"><span>{correct} correct</span><span>{total-correct} missed</span><span>{hintsUsed} {hintsUsed===1?"hint":"hints"} used</span></div>
    <div className="video-quiz-result-review">{state.questions.map((item,index)=>{
     const response=state.answers[index];
     return <details key={item.id}><summary><span className="video-quiz-review-label">{response?.correct?<CheckCircle2 size={18} aria-hidden="true"/>:<XCircle size={18} aria-hidden="true"/>}{index+1}. {item.prompt}</span><span>+</span></summary><p>Your answer: <strong>{response?item.options[response.selected]:"Not answered"}</strong></p><p>Correct answer: <strong>{item.options[item.answer]}</strong></p><p>{item.explanation}</p></details>;
    })}</div>
    <div className="video-quiz-actions"><button type="button" className="button secondary" onClick={start}><RotateCcw size={16} aria-hidden="true"/>Try again</button>{onContinue&&<button type="button" className="button" onClick={onContinue}>{continueLabel}<ArrowRight size={17} aria-hidden="true"/></button>}</div>
    <p className="fine">This practice milestone is for this video. Required course assessments and teacher-reviewed work are recorded separately.</p>
   </div>}
  </>}
 </section>;
}
