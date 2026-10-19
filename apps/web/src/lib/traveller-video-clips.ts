export function youtubeClipEmbed(videoId:string,start:number,end:number){
 if(!/^[A-Za-z0-9_-]{11}$/.test(videoId)||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start)throw new Error("Invalid video clip");
 const url=new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
 url.searchParams.set("start",String(start));url.searchParams.set("end",String(end));url.searchParams.set("autoplay","0");url.searchParams.set("playsinline","1");url.searchParams.set("rel","0");
 return url.toString();
}
export function clipTime(seconds:number){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;}
