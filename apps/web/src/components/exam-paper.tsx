"use client";
export function ExamPaper({examId,title}:{examId:string;title:string}){
 const source=`/api/traveller-exam-assets/${examId}/paper`;
 return <section className="exam-paper-view"><h3>1. Read the original test paper</h3><p>Read each instruction and use the original section and question numbers in your answers. This viewer contains the question paper only.</p><iframe src={`${source}#toolbar=1&view=FitH`} title={`${title} original question paper PDF`} className="exam-paper-frame"/><p><a className="text-link" href={source} target="_blank" rel="noreferrer">Open the question PDF in a new tab</a></p><p className="fine">If your browser cannot display the PDF, use the original page images below. Complete your own Word or PDF answer sheet, or type in the form below.</p></section>;
}
