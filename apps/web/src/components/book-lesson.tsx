import Link from "next/link";
import manifest from "@/content/traveller.json";
import {BookReader} from "./book-reader";

export function BookLesson({lessonId}:{lessonId:string}){const lesson=manifest.lessons.find(l=>l.id===lessonId);if(!lesson)return null;return <><div className="pills" style={{marginBottom:20}}><span>Week {lesson.week} of 18</span><span>{lesson.minutes} minutes suggested</span><span>PDF pages {lesson.pages.join(", ")}</span></div><BookReader lessonId={lessonId} pages={lesson.pages} lessonTitle={lesson.title} minutes={lesson.minutes} targets={lesson.questions.map(q=>q.prompt)}/><details><summary>Pairwork, songs and supplied reference pages<span>+</span></summary>{manifest.lessons.filter(l=>l.kind==="reference").map(l=><p key={l.id}><Link className="text-link" href={`/learn/${l.id}`}>{l.title} →</Link></p>)}</details></>}
