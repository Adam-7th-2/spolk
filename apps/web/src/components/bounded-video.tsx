"use client";
import {useEffect,useRef,useState} from "react";
import {clipTime,youtubeClipEmbed} from "../lib/traveller-video-clips";
type Player={getCurrentTime:()=>number;getPlayerState:()=>number;seekTo:(time:number,allow:boolean)=>void;pauseVideo:()=>void;playVideo:()=>void;destroy:()=>void};
type API={Player:new(element:HTMLIFrameElement,options:{events:{onReady:()=>void;onError:(event:{data:number})=>void;onStateChange:(event:{data:number})=>void}})=>Player};
declare global{interface Window{YT?:API;onYouTubeIframeAPIReady?:()=>void;}}
let apiPromise:Promise<API>|undefined;
function loadAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(!apiPromise)apiPromise=new Promise<API>((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  const script=document.createElement("script");
  const failed=()=>{clearTimeout(timer);script.remove();window.onYouTubeIframeAPIReady=previous;apiPromise=undefined;reject(new Error("YouTube could not be reached."));};
  const timer=setTimeout(failed,15000);
  window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);previous?.();if(window.YT?.Player)resolve(window.YT);else failed();};
  script.src="https://www.youtube.com/iframe_api";script.onerror=failed;document.head.appendChild(script);
 });
 return apiPromise;
}
export function BoundedVideo({videoId,start,end,title,onNext,nextLabel="Next page"}:{videoId:string;start:number;end:number;title:string;onNext?:()=>void;nextLabel?:string}){
 const dialog=useRef<HTMLDialogElement>(null);
 const host=useRef<HTMLDivElement>(null);const player=useRef<Player|null>(null);
 const [ready,setReady]=useState(false);const [error,setError]=useState("");const [elapsed,setElapsed]=useState(0);const [ended,setEnded]=useState(false);const [retry,setRetry]=useState(0);
 useEffect(()=>{
  let disposed=false;let finished=false;let hasPlayed=false;let instance:Player|undefined;let tick:ReturnType<typeof setInterval>|undefined;
  const finish=()=>{
   if(disposed||finished)return;finished=true;
   if(tick)clearInterval(tick);instance?.pauseVideo();instance?.destroy();instance=undefined;player.current=null;host.current?.replaceChildren();
   setElapsed(end-start);setEnded(true);setReady(false);
  };
  const timeout=setTimeout(()=>{if(!disposed)setError("YouTube did not respond. Check your connection or browser video blocking settings, then retry.");},20000);
  const iframe=document.createElement("iframe");const source=new URL(youtubeClipEmbed(videoId,start,end));source.searchParams.set("enablejsapi","1");source.searchParams.set("origin",window.location.origin);source.searchParams.set("cc_lang_pref","en");
  iframe.src=source.toString();iframe.title=title;iframe.className="course-video-frame";iframe.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";iframe.allowFullscreen=true;iframe.referrerPolicy="strict-origin-when-cross-origin";host.current?.replaceChildren(iframe);
  loadAPI().then(api=>{
   if(disposed||!host.current)return;
   instance=new api.Player(iframe,{events:{onReady:()=>{
    if(disposed)return;clearTimeout(timeout);setReady(true);setError("");
    tick=setInterval(()=>{
     if(!instance)return;const time=instance.getCurrentTime();const playing=instance.getPlayerState()===1;
     if(time>=end){finish();}
     else if(time<start-0.4&&playing){instance.seekTo(start,true);}
     else if(playing){setElapsed(Math.max(0,time-start));setEnded(false);}
    },200);
   },onStateChange:({data})=>{if(disposed||finished)return;if(data===1)hasPlayed=true;if(data===0&&hasPlayed)finish();},onError:({data})=>{if(disposed||finished)return;clearTimeout(timeout);setReady(false);setError(`YouTube playback failed (code ${data}). ${data===5?"This browser could not play the video. If you are using VS Code preview, copy this lesson URL into Chrome or Edge; the preview may lack the required video support.":data===101||data===150?"The creator has disabled embedding.":data===153?"YouTube could not verify this website’s origin.":"Try again or check whether YouTube plays in this browser."}`);}}});player.current=instance;
  }).catch(()=>{if(!disposed){clearTimeout(timeout);setError("YouTube could not be reached. Check your connection and retry.");}});
  return()=>{disposed=true;clearTimeout(timeout);if(tick)clearInterval(tick);instance?.destroy();player.current=null;};
 },[videoId,start,end,retry,title]);
 useEffect(()=>{if(ended&&!dialog.current?.open)dialog.current?.showModal();},[ended]);
 const replay=()=>{dialog.current?.close();setReady(false);setError("");setElapsed(0);setEnded(false);setRetry(r=>r+1);};
 return <div><dialog ref={dialog} className="video-finished-dialog" aria-labelledby="video-finished-title"><h2 id="video-finished-title">This video section is finished</h2><p>Playback stopped at {clipTime(end)}. Practise the exercises on this PDF page before moving on.</p><div className="pills"><button type="button" className="button" onClick={replay}>Replay section</button>{onNext&&<button type="button" className="button" onClick={()=>{dialog.current?.close();onNext();}}>{nextLabel}</button>}<button type="button" className="button secondary" onClick={()=>dialog.current?.close()}>Stay on this page</button></div></dialog>{ended&&<p role="status">Section finished. The video has been closed.</p>}<div ref={host} className="video-clip-host" data-start={start} data-end={end}/><p aria-live="polite">{ended?"Section finished. ":""}Section time: {clipTime(Math.floor(elapsed))} / {clipTime(end-start)} · source {clipTime(start)}–{clipTime(end)}</p><div className="pills"><button type="button" className="button small" disabled={!ready||!!error} onClick={()=>{if(ended){player.current?.seekTo(start,true);setElapsed(0);setEnded(false);}player.current?.playVideo();}}>Play section</button><button type="button" className="button small secondary" disabled={!ready||!!error} onClick={()=>player.current?.pauseVideo()}>Pause</button><button type="button" className="button small secondary" disabled={(!ready&&!ended)||!!error} onClick={replay}>Replay section</button></div>{error&&<div role="alert"><p>{error}</p><p><a className="text-link" href={typeof window!=="undefined"?window.location.href:"#"} target="_blank" rel="noopener noreferrer">Open this lesson in a browser</a> ? if this opens another editor preview, copy the address into Chrome or Edge.</p><button type="button" className="button small secondary" onClick={()=>{setReady(false);setError("");setElapsed(0);setEnded(false);setRetry(r=>r+1);}}>Retry player</button></div>}<p className="fine">YouTube’s timeline shows the full source video. The section timer above tracks only this PDF part; playback pauses at its boundary.</p></div>;
}
