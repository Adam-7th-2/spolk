import "server-only";
import {readFile} from "node:fs/promises";
import path from "node:path";
const expected="4a8aaabad1c8f7a357d252fd1c6c834c5fcf877f9c56cd4f66dfde46a7fed20e";
// Caller must obtain page rows through RLS before using this private text index.
export async function studentBookPageText():Promise<Record<string,string>>{
 try{const data=JSON.parse(await readFile(path.join(process.cwd(),"private/books/traveller/page-text.json"),"utf8"));if(data.sourceSha256!==expected||typeof data.pages!=="object"||!data.pages)return {};return Object.fromEntries(Object.entries(data.pages).filter(([page,text])=>/^\d{1,3}$/.test(page)&&Number(page)>=1&&Number(page)<=126&&typeof text==="string")) as Record<string,string>;}catch{return {}}
}
