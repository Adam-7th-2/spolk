import {BookOpen,Lightbulb,TriangleAlert} from "lucide-react";
import type {LessonGuidance} from "../lib/lesson-guidance";
export function DetailedExplanation({guidance}:{guidance:LessonGuidance}){
 return <div className="detailed-explanation"><h5><BookOpen size={17} aria-hidden="true"/>{guidance.rule}</h5><p>{guidance.explanation}</p><div className="explanation-example"><strong><Lightbulb size={16} aria-hidden="true"/>Another example</strong><p>{guidance.example}</p></div><div className="explanation-mistake"><strong><TriangleAlert size={16} aria-hidden="true"/>Watch out for this</strong><p>{guidance.commonMistake}</p></div></div>;
}
