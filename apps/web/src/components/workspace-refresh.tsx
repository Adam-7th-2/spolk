"use client";
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
export function WorkspaceRefresh(){
 const router=useRouter();
 useEffect(()=>{const update=()=>{if(!document.hidden)router.refresh();};const timer=setInterval(update,30000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};},[router]);
 return null;
}
