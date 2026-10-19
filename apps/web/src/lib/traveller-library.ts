import folders from "../content/traveller-library.json";
export {folders};
export const MAX_LIBRARY_FILE=100*1024*1024;
export function libraryFolder(slug:string){return folders.find(f=>f.slug===slug);}
export function canManageLibrary(roles:readonly string[]){return roles.includes("admin")||roles.includes("super_admin");}
export function libraryExtension(name:string){const match=/\.(pdf|mp3|wav|m4a|ogg|flac|zip|rar|7z)$/i.exec(name);return match?.[1].toLowerCase()||null;}
export function validLibraryBytes(extension:string,bytes:Uint8Array){const starts=(s:string)=>Array.from(s).every((v,i)=>bytes[i]===v.charCodeAt(0));const ascii=(a:number,b:number)=>String.fromCharCode(...bytes.slice(a,b));
 switch(extension){case "pdf":return starts("%PDF-");case "mp3":return starts("ID3")||(bytes[0]===255&&(bytes[1]&224)===224);case "wav":return starts("RIFF")&&ascii(8,12)==="WAVE";case "m4a":return ascii(4,8)==="ftyp";case "ogg":return starts("OggS");case "flac":return starts("fLaC");case "zip":return bytes[0]===80&&bytes[1]===75&&[3,5,7].includes(bytes[2]);case "rar":return starts("Rar!");case "7z":return bytes[0]===55&&bytes[1]===122&&bytes[2]===188&&bytes[3]===175;default:return false;}
}
