"use client";
import {NextLearningActivity} from "./learning-step-context";
import {useContext,useRef} from "react";
import {VideoQuiz} from "./video-quiz";
import {ExternalLink} from "lucide-react";
import {BoundedVideo} from "./bounded-video";
import {travellerVideo,youtubeWatch} from "../lib/traveller-videos";
import {clipTime} from "../lib/traveller-video-clips";
export function TravellerVideo({lessonId}:{lessonId?:string}){
 const next=useContext(NextLearningActivity);const quiz=useRef<HTMLDivElement>(null);const video=lessonId?travellerVideo(lessonId):undefined;
 if(!video)return null;
 return <article className="dashboard-card course-video"><div className="eyebrow">WATCH · ENGLISH · {clipTime(video.seconds)}</div><h2>{video.goal}</h2><p>{video.title}</p><p className="fine">{video.channel} · supplementary listening for this lesson’s topic</p><BoundedVideo videoId={video.videoId} start={video.start} end={video.end} title={video.title} onNext={()=>{quiz.current?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});quiz.current?.focus({preventScroll:true});}} nextLabel="Try the video quiz"/><div className="lms-watch-task"><h3>While you watch</h3><p>{video.watch}</p><h3>Try it yourself</h3><p>{video.practice}</p></div><div ref={quiz} tabIndex={-1}><VideoQuiz videoId={video.videoId} videoSeconds={video.seconds} onContinue={next?.go} continueLabel={next?.label}/></div><a className="text-link" href={youtubeWatch(video.videoId)} target="_blank" rel="noreferrer noopener">Watch source on YouTube <ExternalLink size={15}/></a><p className="fine">This short video supports the lesson topic. Complete the original book activities in Read, then the assigned practice and homework. Watching does not award a grade or mark the lesson complete.</p></article>;
}
