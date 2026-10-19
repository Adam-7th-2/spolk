import videos from "../content/traveller-videos.json";
export {videos as travellerVideos};
export function travellerVideo(lessonId:string){return videos.videos.find(v=>v.lessonId===lessonId);}
export function youtubeEmbed(videoId?:string){const id=videoId||videos.videos[0].videoId;if(!/^[A-Za-z0-9_-]{11}$/.test(id))throw new Error("Invalid YouTube video identifier");const url=new URL(`https://www.youtube-nocookie.com/embed/${id}`);url.searchParams.set("autoplay","0");url.searchParams.set("playsinline","1");url.searchParams.set("rel","0");url.searchParams.set("cc_lang_pref","en");return url.toString();}
export function youtubeWatch(videoId?:string){const id=videoId||videos.videos[0].videoId;if(!/^[A-Za-z0-9_-]{11}$/.test(id))throw new Error("Invalid YouTube video identifier");return `https://www.youtube.com/watch?v=${id}`;}
