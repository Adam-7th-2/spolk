"use client";
import {useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Headphones,Volume2} from "lucide-react";
import {travellerAudioTracksForPages} from "@/lib/traveller-audio";
import {clipTime} from "@/lib/traveller-video-clips";

export function TravellerAudio({pages}:{pages:number[]}){
 const tracks=travellerAudioTracksForPages(pages);
 const[index,setIndex]=useState(0),[error,setError]=useState(false),[remaining,setRemaining]=useState<number|null>(null);
 const section=useRef<HTMLElement>(null),track=tracks[index];
 if(!track)return <section className="reading-no-audio"><Headphones size={18} aria-hidden="true"/><p>No listening marker is mapped to this page. Continue with its printed reading or writing activities.</p></section>;
 const change=(next:number)=>{setIndex(next);setError(false);setRemaining(null);requestAnimationFrame(()=>{section.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"});});};
 const source=`/api/traveller-audio/${track.cd}/${track.track}`;
 return <section className="video-quiz reading-audio" ref={section} aria-label="Audio for this page">
  <div className="video-quiz-heading"><span className="eyebrow"><Headphones size={16} aria-hidden="true"/> LISTEN & PRACTISE</span><span className="video-quiz-tag">PDF page {track.page} · Listening marker {track.marker}</span></div>
  <h3>{track.label}</h3><div className="video-quiz-toolbar"><span>Audio card {index+1} of {tracks.length}</span><span className="video-quiz-clock"><Volume2 size={17} aria-hidden="true"/>{remaining===null?"Ready to listen":`${clipTime(remaining)} remaining`}</span></div>
  <div className="video-quiz-progress" role="progressbar" aria-label="Listening marker position" aria-valuenow={index+1} aria-valuemin={0} aria-valuemax={tracks.length}><span style={{width:`${(index+1)/tracks.length*100}%`}}/></div>
  <p>Find listening marker {track.marker} on PDF page {track.page}. Read that exercise’s instructions before you press Play.</p>
  <audio key={source} controls preload="metadata" src={source} onError={()=>setError(true)} onLoadedMetadata={event=>{const duration=event.currentTarget.duration;if(Number.isFinite(duration))setRemaining(Math.ceil(duration));}} onTimeUpdate={event=>{const audio=event.currentTarget;if(Number.isFinite(audio.duration))setRemaining(Math.max(0,Math.ceil(audio.duration-audio.currentTime)));}} onEnded={()=>setRemaining(0)}>Your browser cannot play this track. Use the download link below.</audio>
  {error&&<p role="alert" className="status error">The track could not be played. Try downloading it, or reload the lesson to retry.</p>}
  {remaining===0&&<p className="status" role="status">Track finished. Check your response against the exercise instructions, then repeat any phrases you want to practise.</p>}
  <div className="reading-listen-steps"><h4>Make each listen count</h4><ol><li><strong>First listen:</strong> follow the printed task and listen for its main meaning.</li><li><strong>Second listen:</strong> pause where needed and note the words or details the exercise asks for.</li><li><strong>Speak:</strong> replay a short phrase and repeat it, then use the same language with your own information.</li></ol>{track.verifiedText&&<details><summary>Supporting language for this listening task<span>+</span></summary><p>{track.verifiedText}</p></details>}</div>
  <div className="video-quiz-actions"><button type="button" className="button secondary" disabled={index===0} onClick={()=>change(index-1)}><ArrowLeft size={16} aria-hidden="true"/>Previous audio</button><a className="text-link" download href={source}>Download track</a><button type="button" className="button" disabled={index===tracks.length-1} onClick={()=>change(index+1)}>Next audio<ArrowRight size={16} aria-hidden="true"/></button></div>
  <p className="fine">Tracks follow the existing page-to-CD listening-marker order. Practise using this page’s original task; this guide does not invent a transcript or an answer to a recording.</p>
 </section>;
}
