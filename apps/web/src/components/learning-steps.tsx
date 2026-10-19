"use client";
import {NextLearningActivity} from "./learning-step-context";
import {useId,useState,type ReactNode} from "react";
import {AskTeacher} from './ask-teacher';
export function LearningSteps({steps,lessonId}:{steps:{id:string;title:string;description:string;content:ReactNode}[];lessonId?:string}){
 const [active,setActive]=useState(0);const prefix=useId();
 function go(index:number){setActive(index);document.getElementById(`${prefix}-panel-${index}`)?.scrollIntoView({behavior:"smooth",block:"start"});}
 return <div className="learning-steps">
  <div className="lms-step-tabs" role="tablist" aria-label="Lesson activities">{steps.map((s,i)=><button key={s.id} id={`${prefix}-tab-${i}`} role="tab" type="button" aria-selected={active===i} aria-controls={`${prefix}-panel-${i}`} tabIndex={active===i?0:-1} onKeyDown={e=>{const next=e.key==="ArrowRight"?(i+1)%steps.length:e.key==="ArrowLeft"?(i-1+steps.length)%steps.length:e.key==="Home"?0:e.key==="End"?steps.length-1:null;if(next!==null){e.preventDefault();go(next);document.getElementById(`${prefix}-tab-${next}`)?.focus();}}} onClick={()=>go(i)}>{i+1}. {s.title}</button>)}</div>
  {steps.map((s,i)=><section key={s.id} id={`${prefix}-panel-${i}`} role="tabpanel" aria-labelledby={`${prefix}-tab-${i}`} hidden={active!==i}>
   <div className="lms-activity-heading"><span className="eyebrow">ACTIVITY {i+1} OF {steps.length}</span><h2>{s.title}</h2><p>{s.description}</p></div>
   <NextLearningActivity.Provider value={i<steps.length-1?{go:()=>go(i+1),label:`Continue to ${steps[i+1].title}`}:undefined}>{(s.id!=="watch"||active===i)&&s.content}</NextLearningActivity.Provider>
   {lessonId&&<AskTeacher lessonId={lessonId} section={s.id} title={s.title}/>}
   <div className="lms-activity-footer"><button type="button" className="button secondary" disabled={i===0} onClick={()=>go(i-1)}>← Previous activity</button>{i<steps.length-1&&<button type="button" className="button" onClick={()=>go(i+1)}>Continue to {steps[i+1].title} →</button>}</div>
  </section>)}
 </div>;
}
