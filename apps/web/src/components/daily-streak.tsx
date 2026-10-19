"use client";
import {useEffect,useState} from "react";
type Checkin={current:number;longest:number;today:string;days:string[]};
export function DailyStreak(){
 const [data,setData]=useState<Checkin|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let active=true;let pending=false;
  const check=async()=>{
   if(document.visibilityState==="hidden"||pending)return;pending=true;
   try{const response=await fetch("/api/daily-checkin",{method:"POST",cache:"no-store"});if(!response.ok)throw new Error();const result=await response.json();if(active){setData(result);setError(false);}}
   catch{if(active)setError(true);}finally{pending=false;}
  };
  void check();const timer=setInterval(()=>{void check();},60000);
  document.addEventListener("visibilitychange",check);
  return()=>{active=false;clearInterval(timer);document.removeEventListener("visibilitychange",check);};
 },[retry]);
 const days=data?Array.from({length:7},(_,i)=>{const day=new Date(`${data.today}T00:00:00Z`);day.setUTCDate(day.getUTCDate()-6+i);return day.toISOString().slice(0,10);}):[];
 return <article className="dashboard-card"><div className="eyebrow">ONE DAY AT A TIME</div><h2>Your daily streak</h2><p>Visit your dashboard each day to check in automatically. Days reset at midnight UTC.</p>{data&&<><div className="lms-stats"><span><strong>{data.current}</strong> day streak</span><span>Best: {data.longest} days</span><span>Checked in today</span></div><ul className="streak-week" aria-label="Check-ins over the last seven days">{days.map(day=><li key={day} className={data.days.includes(day)?"checked":""}><span>{new Date(`${day}T00:00:00Z`).toLocaleDateString("en",{weekday:"short",timeZone:"UTC"})}</span><strong aria-label={`${day}: ${data.days.includes(day)?"checked in":"no check-in"}`}>{data.days.includes(day)?"✓":"—"}</strong></li>)}</ul><h3>Your weekly goal</h3><p>{data.days.length} of 5 check-in days in the last seven days. {data.days.length>=5?"Goal reached. Keep showing up!":"Build a steady learning habit."}</p><progress aria-label="Weekly check-in goal" max={5} value={Math.min(5,data.days.length)}/><p className="fine">Check-ins track visits. Lessons and grades are tracked separately below.</p></>}{!data&&!error&&<p role="status">Checking in…</p>}{error&&<p role="status">Check-in is temporarily unavailable. You can keep learning. <button type="button" className="button small secondary" onClick={()=>setRetry(r=>r+1)}>Retry check-in</button></p>}</article>;
}
