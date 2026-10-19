import {retrieveEvidence,type Evidence} from "./rag";
export function practiceEvidence(question:string,courseId:string,authorized:Evidence[],lessonId?:string){
 const scoped=authorized.filter(e=>e.courseId===courseId&&(!lessonId||!e.lessonId||e.lessonId===lessonId));
 const matches=retrieveEvidence(question,courseId,scoped);
 if(matches.length)return matches;
 // Conversational requests need lesson context rather than lexical overlap.
 if(/^(hello|hi|hey)\b|\b(practi[cs]e|current lesson|this lesson|help me|start|conversation)\b/i.test(question))return scoped.slice(0,2);
 return [];
}
