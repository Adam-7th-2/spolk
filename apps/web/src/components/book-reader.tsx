"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
import {ArrowLeft,ArrowRight,BookOpen,Clock3,Expand,ExternalLink} from "lucide-react";
import {TravellerAudio} from "./traveller-audio";
export function BookReader({lessonId,pages,lessonTitle="Read the original pages",minutes=30,targets=[]}:{lessonId:string;pages:number[];lessonTitle?:string;minutes?:number;targets?:string[]}){
 const[index,setIndex]=useState(0),[zoom,setZoom]=useState(false),[aid,setAid]=useState<{page:number;text:string}|null>(null);
 const card=useRef<HTMLElement>(null),page=pages[index],readingAid=aid?.page===page?aid.text:"";
 useEffect(()=>{let cancel=false;fetch(`/api/book-pages/${lessonId}/${page}/text`).then(async response=>response.ok?response.json():null).then(data=>{if(!cancel)setAid({page,text:typeof data?.text==="string"?data.text:""});}).catch(()=>{if(!cancel)setAid({page,text:""});});return()=>{cancel=true;};},[lessonId,page]);
 const change=(next:number)=>{setIndex(next);setZoom(false);requestAnimationFrame(()=>{card.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});card.current?.focus({preventScroll:true});});};
 return <article className="video-quiz reading-card" ref={card} tabIndex={-1}>
  <div className="video-quiz-heading"><span className="eyebrow"><BookOpen size={16} aria-hidden="true"/> READ & LEARN</span><span className="video-quiz-tag">Original book · PDF page {page}</span></div>
  <h3>{lessonTitle}</h3><div className="video-quiz-facts"><span>Page {index+1} of {pages.length}</span><span><Clock3 size={17} aria-hidden="true"/>About {Math.max(1,Math.ceil(minutes/Math.max(1,pages.length)))} min for this page</span><a className="text-link" href={`/api/book-lessons/${lessonId}`} target="_blank" rel="noreferrer">Open original PDF <ExternalLink size={14} aria-hidden="true"/></a></div>
  <div className="video-quiz-progress" role="progressbar" aria-label="Reading page position" aria-valuenow={index+1} aria-valuemin={0} aria-valuemax={pages.length}><span style={{width:`${(index+1)/pages.length*100}%`}}/></div>
  <div className="reading-page-heading"><div><span className="video-quiz-question-label">READING CARD {String(index+1).padStart(2,"0")}</span><p>Read the page, follow its numbered exercises, and use the listening cards below for its audio activities.</p></div><button type="button" className="text-link" onClick={()=>setZoom(!zoom)}><Expand size={16} aria-hidden="true"/>{zoom?"Fit page":"Zoom in"}</button></div>
  <div className="book-read"><div className={`book-page ${zoom?"zoomed":""}`}><Image unoptimized key={page} src={`/api/book-pages/${lessonId}/${page}`} alt={`Original Traveller Beginners PDF page ${page}. Open the lesson PDF for a separate copy.`} width={1224} height={1584} style={{height:"auto"}}/></div><aside className="reading-aid"><h4>Reading aid</h4><p className="fine">Machine-read text from this scan. The page image is the original. Check anything that looks uncertain.</p><p>{readingAid||"Reading aid is loading, or this page has no extracted text yet."}</p></aside></div>
  <TravellerAudio key={page} pages={[page]}/>
  {targets.length>0&&<div className="reading-focus-card"><h4>Connect the page to your practice</h4><p>Look across this lesson’s pages for language that will help you answer these prompts. Read the surrounding examples, then say your answer aloud.</p><ul>{targets.map(target=><li key={target}>{target}</li>)}</ul><p className="fine">The Practice quiz activity checks your answers and explains the rule step by step.</p></div>}
  <div className="video-quiz-actions reading-navigation"><button type="button" className="button secondary" disabled={index===0} onClick={()=>change(index-1)}><ArrowLeft size={17} aria-hidden="true"/>Previous page</button><span aria-live="polite">PDF page {page} · {index+1} of {pages.length}</span><button type="button" className="button" disabled={index===pages.length-1} onClick={()=>change(index+1)}>Next page<ArrowRight size={17} aria-hidden="true"/></button></div>
  <p className="fine">The page image preserves the supplied scan. PDF page numbers may differ from the printed page numbers. Complete the original exercises and submit the assigned work for teacher review.</p>
 </article>;
}
