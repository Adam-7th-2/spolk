export type TravellerAudioTrack = {cd:number;track:number;label:string;page?:number;marker?:number;verifiedText?:string;transcript?:string};

/** The supplied Student's Book archive is preserved in CD/track order. */
export const travellerAudioTracks: TravellerAudioTrack[] = [1,2,3].flatMap(cd => {
 const count = cd===1 ? 71 : cd===2 ? 62 : 59;
 return Array.from({length:count},(_,i)=>({cd,track:i+1,label:`CD ${cd} · Track ${String(i+1).padStart(2,"0")}`}));
});

export function travellerAudioPath(cd:number,track:number){
 const count=cd===1?71:cd===2?62:cd===3?59:0;
 if(!Number.isInteger(cd)||!Number.isInteger(track)||track<1||track>count)return null;
 return `CD${cd} / ${String(track).padStart(2,"0")} Дорожка ${track}.wma`;
}
export function travellerAudioMp3Path(cd:number,track:number){
 const relative=travellerAudioPath(cd,track);return relative?.replace(/^CD(\d+) \/ (\d{2}) Дорожка (\d+)\.wma$/,(m,c,n)=>`CD${c}/${n} Дорожка ${track}.mp3`)||null;
}

// Listening/CD markers detected from the supplied scanned pages, in page order.
const audioOccurrenceCountByPage:Record<number,number>={2:1,4:1,5:2,6:2,8:2,9:4,10:2,12:2,13:2,14:5,15:2,16:2,20:1,22:1,23:1,24:2,25:2,26:2,28:3,29:4,30:2,31:1,34:1,36:2,38:2,39:2,40:2,41:2,42:2,43:3,44:1,45:2,48:1,50:2,52:2,53:2,54:1,55:2,56:2,57:1,58:2,59:3,60:1,62:1,64:2,65:2,66:2,67:1,68:2,69:4,70:3,71:3,72:2,76:1,80:4,81:7,82:2,83:1,84:2,85:5,86:4,90:1,92:1,93:3,94:1,95:1,96:2,98:3,99:5,100:2,103:3,104:1,106:3,108:2,109:1,110:3,111:4,112:2,113:4,114:2,118:1,124:1};
const pageAudioText:Record<string,string>={
 "6:0":"Canada — Canadian; USA — American; Ireland — Irish; UK — British; South Africa — South African; Australia — Australian; New Zealand — New Zealander.",
 "6:1":"What does this word mean? Open your books. Write a sentence. I don’t understand. Speak in English. Can you repeat that? I don’t know. Listen to the CD. Can I go out? Look at the board. Be quiet, please. That’s right. How do you say … in English? Close your books. Read the text."
};
export function travellerAudioTracksForPages(pages:number[]){
 const starts=new Map<number,number>();let cursor=1;
 for(let page=1;page<=126;page++){starts.set(page,cursor);cursor+=audioOccurrenceCountByPage[page]||0;}
 const result:TravellerAudioTrack[]=[];
 for(const page of pages)for(let i=0;i<(audioOccurrenceCountByPage[page]||0);i++){const base=travellerAudioTracks[(starts.get(page)||1)+i-1];if(base)result.push({...base,page,marker:i+1,verifiedText:pageAudioText[`${page}:${i}`],transcript:pageAudioText[`${page}:${i}`]||`Audio for the listening marker on supplied PDF page ${page}, item ${i+1}. Follow the printed exercise and repeat or answer in order.`});}
 return result;
}
