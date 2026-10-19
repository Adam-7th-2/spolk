import "server-only";
import {database} from "./supabase";
import {chunkText,type Evidence} from "./rag";
import {travellerVideo} from "./traveller-videos";
import {studentBookPageText} from "./book-page-evidence";

export type CourseEvidence=Evidence & {url:string;kind:"note"|"lesson"|"video"|"pdf"};
// All lesson rows come from the caller's RLS-scoped connection. No private exam
// keys, answer manifests or listening transcripts are imported by this module.
export async function collectCourseEvidence(db:Awaited<ReturnType<typeof database>>,courseId:string,lessonId?:string){
 const [{data:course},{data:lessons,error},{data:docs}]=await Promise.all([
  db.from("courses").select("slug").eq("id",courseId).single(),
  db.from("lessons").select("id,title,body").eq("course_id",courseId).order("position").limit(100),
  db.from("ai_knowledge_documents").select("id,title,course_id,lesson_id,ai_document_chunks(id,content)").eq("course_id",courseId).eq("published",true).limit(30)
 ]);
 if(error)throw new Error("Course lessons could not be loaded.");
 const readable=(lessons||[]).filter(l=>!lessonId||l.id===lessonId);
 if(lessonId&&!readable.length)throw new Error("This lesson is locked or unavailable.");
 const evidence:CourseEvidence[]=[];
 for(const lesson of readable){
  for(const [index,content] of chunkText(`${lesson.title}\n${lesson.body}`).entries())evidence.push({id:`lesson-${lesson.id}-${index}`,documentId:lesson.id,title:lesson.title,courseId,lessonId:lesson.id,content,url:`/learn/${lesson.id}`,kind:"lesson"});
  const video=course?.slug==="traveller-beginners"?travellerVideo(lesson.id):undefined;
  if(video)evidence.push({id:`video-${lesson.id}`,documentId:lesson.id,title:video.title,courseId,lessonId:lesson.id,content:`Related English video: ${video.title}. Learning goal: ${video.goal} Practice: ${video.practice} Watching guidance: ${video.watch}. This is topic guidance, not a transcript of the recording.`,url:`/learn/${lesson.id}`,kind:"video"});
 }
 for(const doc of docs||[]){
  if(lessonId&&doc.lesson_id&&doc.lesson_id!==lessonId)continue;
  for(const chunk of doc.ai_document_chunks)evidence.push({id:chunk.id,documentId:doc.id,title:doc.title,courseId,lessonId:doc.lesson_id,content:chunk.content,url:doc.lesson_id?`/learn/${doc.lesson_id}`:`/dashboard/courses/${courseId}`,kind:"note"});
 }
 // Page OCR is deliberately lesson-scoped. Loading every scanned page for a
 // course-level greeting made the speaking page unnecessarily slow.
 if(course?.slug==="traveller-beginners"&&lessonId&&readable.length){
  const {data:pages}=await db.from("book_lesson_pages").select("lesson_id,pdf_page").eq("book_id","traveller-beginners").in("lesson_id",readable.map(l=>l.id));
  const text=await studentBookPageText();
  for(const page of pages||[]){
   for(const [index,content] of chunkText(text[String(page.pdf_page)]||"").entries())evidence.push({id:`page-${page.pdf_page}-${index}`,documentId:page.lesson_id,title:`Original student book · PDF page ${page.pdf_page} (OCR)`,courseId,lessonId:page.lesson_id,content:`OCR transcription; check original page if unclear.\n${content}`,url:`/api/book-pages/${page.lesson_id}/${page.pdf_page}`,kind:"pdf"});
  }
 }
 return {evidence,lessons:readable.map(l=>({id:l.id,title:l.title}))};
}
