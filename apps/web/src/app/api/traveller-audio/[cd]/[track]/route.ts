import {NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {z} from "zod";
import {currentUser,database} from "@/lib/supabase";
import {travellerAudioPath,travellerAudioMp3Path,travellerAudioTracksForPages} from "@/lib/traveller-audio";

export const runtime="nodejs";

export async function GET(_:Request,{params}:{params:Promise<{cd:string;track:string}>}){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"Sign in to listen to course audio."},{status:401});
 const parsed=z.object({cd:z.coerce.number().int().min(1).max(3),track:z.coerce.number().int().min(1).max(71)}).safeParse(await params);
 if(!parsed.success)return NextResponse.json({error:"Invalid audio track."},{status:400});
 const db=await database();
 const {data,error}=await db.from("courses").select("id").eq("slug","traveller-beginners").maybeSingle();
 if(error||!data)return NextResponse.json({error:"Traveller course is unavailable."},{status:404});
 let allowed=false;
 try{
  const[admin,teacher,student]=await Promise.all([db.rpc('is_admin'),db.rpc('teaches',{cid:data.id}),db.rpc('enrolled',{cid:data.id})]);
  allowed=Boolean(admin.data||teacher.data);
  if(!allowed&&student.data){
   const{data:pages,error:pageError}=await db.from('book_lesson_pages').select('pdf_page').eq('book_id','traveller-beginners');
   allowed=!pageError&&travellerAudioTracksForPages((pages||[]).map(page=>page.pdf_page)).some(track=>track.cd===parsed.data.cd&&track.track===parsed.data.track);
  }
 }catch{allowed=false;}
 if(!allowed)return NextResponse.json({error:"This audio is restricted to Traveller course members."},{status:403});
 const relative=travellerAudioPath(parsed.data.cd,parsed.data.track);const mp3=travellerAudioMp3Path(parsed.data.cd,parsed.data.track);
 if(!relative)return NextResponse.json({error:"Audio track does not exist."},{status:404});
 try{
  const mp3Path=mp3&&resolve(process.cwd(),"private/library/traveller/beginners/Music/mp3",mp3);const wmaPath=resolve(process.cwd(),"private/library/traveller/beginners/Music/Traveller_Beginner_Audio_www.frenglish.ru",relative);let file=mp3Path;let type="audio/mpeg";try{if(!file)throw new Error();await readFile(file);}catch{file=wmaPath;type="audio/x-ms-wma";}
  const bytes=await readFile(file);return new Response(new Uint8Array(bytes),{headers:{"Content-Type":type,"Content-Disposition":"inline","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch{return NextResponse.json({error:"The supplied audio file is unavailable on this server."},{status:503});}
}
