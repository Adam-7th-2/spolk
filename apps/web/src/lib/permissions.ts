export type Role = "student"|"teacher"|"guardian"|"admin"|"super_admin";
export type Actor = { id:string; roles:Role[] };
export type LessonAccess = { enrolled:boolean; instructor:boolean; releasedAt:string|null; prerequisitesComplete:boolean };
export function canOpenLesson(actor:Actor|null, access:LessonAccess, now=new Date()):boolean {
 if(!actor) return false;
 if(actor.roles.includes("super_admin")||actor.roles.includes("admin")||access.instructor) return true;
 return access.enrolled && access.prerequisitesComplete && access.releasedAt!==null && new Date(access.releasedAt)<=now;
}
export function canViewStudent(actor:Actor, studentId:string, assigned:boolean, guardianLinked:boolean):boolean {
 return actor.id===studentId || actor.roles.some(r=>r==="admin"||r==="super_admin") || (actor.roles.includes("teacher")&&assigned) || (actor.roles.includes("guardian")&&guardianLinked);
}
export function canJoinSession(enrolled:boolean, invited:boolean, expiresAt:string, now=new Date()) { return enrolled && invited && new Date(expiresAt)>now; }
export function canRecord(actor:Actor, assigned:boolean, consent:boolean) { return consent && assigned && actor.roles.some(r=>["teacher","admin","super_admin"].includes(r)); }
export function allowedUpload(name:string, type:string, size:number) { return size>0 && size<=10*1024*1024 && ((/\.pdf$/i.test(name)&&type==="application/pdf")||(/\.txt$/i.test(name)&&type==="text/plain")); }
