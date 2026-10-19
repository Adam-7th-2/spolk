"use client";
import {useState} from 'react';
import {ActionForm} from './action-form';
import {submitHomework} from '@/app/workspace/actions';
export function HomeworkForm({assignmentId}:{assignmentId:string}){
 const[hasFiles,setHasFiles]=useState(false);
 return <ActionForm action={submitHomework} label="Submit homework"><input name="assignment_id" value={assignmentId} type="hidden"/><label>Your answer<textarea name="body" required={!hasFiles} maxLength={20000}/></label><label>Upload assignment files<input name="files" type="file" accept=".pdf,.txt,.png,.jpg,.jpeg,.docx" multiple onChange={event=>setHasFiles(Boolean(event.target.files?.length))}/><small>Up to 3 files, 10 MB each. PDF, TXT, JPG, PNG or DOCX.</small></label></ActionForm>;
}
