"use client";
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {Bell,MessageCircle,UserRound} from 'lucide-react';
import {usePathname} from 'next/navigation';
export function WorkspaceLinks({firstName=""}:{firstName?:string}){
 const pathname=usePathname();
 const[count,setCount]=useState(0);
 useEffect(()=>{let alive=true;const controller=new AbortController();async function update(){if(document.hidden)return;try{const response=await fetch('/api/workspace/notifications',{cache:'no-store',signal:controller.signal});if(response.ok){const data=await response.json();if(alive)setCount(data.unread);}}catch{}}
 void update();const timer=setInterval(()=>void update(),30000);document.addEventListener('visibilitychange',update);window.addEventListener('focus',update);window.addEventListener('workspace-updated',update);
 return()=>{alive=false;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',update);window.removeEventListener('focus',update);window.removeEventListener('workspace-updated',update);};},[pathname]);
 return <div className="workspace-links"><Link href="/workspace/messages" aria-label="Teacher conversations"><MessageCircle size={19}/><span>Messages</span></Link><Link href="/workspace/notifications" aria-label={`Notifications, ${count>=100?'100 or more':count} unread`}><Bell size={19}/>{count>0&&<b>{count>=100?'99+':count}</b>}<span>Notifications</span></Link><Link href="/workspace/profile" aria-label="Profile settings"><UserRound size={19}/><span>{firstName?`Hi, ${firstName}`:"Profile"}</span></Link></div>;
}
