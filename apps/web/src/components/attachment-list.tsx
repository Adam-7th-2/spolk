import {database} from "@/lib/supabase";
export async function AttachmentList({submissionId}:{submissionId:string}){
 const db=await database();const{data,error}=await db.from('submission_files').select('id,original_name,size_bytes').eq('submission_id',submissionId);
 if(error)return <p role="alert">Attachments could not be loaded. Refresh to try again.</p>;
 return data?.length?<ul className="attachment-list" aria-label="Submitted files">{data.map(file=><li key={file.id}><a className="text-link" href={`/api/homework-files/${file.id}`}>{file.original_name}</a><small> {(Number(file.size_bytes)/1024).toFixed(1)} KB</small></li>)}</ul>:null;
}
