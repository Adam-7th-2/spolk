"use client";
import {useActionState,useState} from "react";
import {submitHomework} from "@/app/workspace/actions";
export function BookHomework({assignmentId,pages}:{assignmentId:string;pages:number[]}){
 const[responses,setResponses]=useState<Record<number,string>>({});const[reflection,setReflection]=useState("");const[audio,setAudio]=useState("Audio used from the supplied CD/track player");
 const[state,action,pending]=useActionState(submitHomework,{message:"",error:false});
 const[hasFiles,setHasFiles]=useState(false);
 const body=pages.map(page=>`PDF page ${page} — original exercise responses:\n${responses[page]||""}`).join("\n\n")+`\n\nSpeaking/pairwork reflection: ${reflection}\nListening status: ${audio}`;
 return <form action={action}>
  <input type="hidden" name="assignment_id" value={assignmentId}/><input type="hidden" name="body" value={body}/>
  <p>Answer the original exercises below, upload your completed work, or use both. Your draft stays here when you switch activities.</p>
  <label>Upload assignment files<input name="files" type="file" accept=".pdf,.txt,.png,.jpg,.jpeg,.docx" multiple onChange={event=>setHasFiles(Boolean(event.target.files?.length))}/><small>Up to 3 files, 10 MB each. PDF, TXT, JPG, PNG or DOCX.</small></label>
  {pages.map(page=><label key={page}>Original PDF page {page} — numbered exercise answers<textarea required={!hasFiles} minLength={hasFiles?0:1} maxLength={6000} value={responses[page]||""} onChange={e=>setResponses({...responses,[page]:e.target.value})} placeholder="Exercise 1A: … Exercise 2B: …"/></label>)}
  <label>Speaking/pairwork reflection<textarea maxLength={1000} value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="What did you practice with your teacher or partner?"/></label>
  <label>Listening activities<select value={audio} onChange={e=>setAudio(e.target.value)}><option>Audio used from the supplied CD/track player</option><option>No listening exercise on these pages</option></select></label>
  {state.message&&<p role="status" className={`status ${state.error?"error":""}`}>{state.message}</p>}
  <button className="button" disabled={pending||body.length>20000}>{pending?"Submitting…":"Submit original-page work"}</button><p className="fine">Your teacher reviews this work. A supplementary quiz score does not automatically grade the original exercises.</p>
 </form>;
}
