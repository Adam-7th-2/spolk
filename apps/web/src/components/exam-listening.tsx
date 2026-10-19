"use client";
import listening from "../content/traveller-listening.json";
export function ExamListening({examId}:{examId:string}){
 const clips=listening.clips.filter(c=>c.examId===examId);
 return <section className="exam-resource-kit"><h3>Listen by question</h3><p>Use the original listening exercise on the indicated PDF page. Each player contains only the related part of the original recording.</p>{clips.map(c=><div className="exam-listening-question" key={c.questionId}><strong>{c.label} · original PDF page {c.page}</strong><p className="fine">Source {c.start.toFixed(1)}–{c.end.toFixed(1)} seconds. Context may overlap with another question.</p><audio aria-label={`${c.label} audio`} controls preload="none" src={`/api/traveller-exam-assets/${examId}/listen-${c.questionId.split(".")[1]}`} style={{width:"100%"}}/></div>)}</section>;
}
