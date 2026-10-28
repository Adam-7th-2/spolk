"use client";

import Link from "next/link";
import {Menu,X} from "lucide-react";
import {useId,useState} from "react";

type MobileNavigationLink={href:string;label:string};

export function MobileNavigation({links}:{links:MobileNavigationLink[]}){
 const[open,setOpen]=useState(false);
 const id=useId();
 return <div className="mobile-menu">
  <button type="button" className="mobile-menu-toggle" aria-label={open?"Close navigation menu":"Open navigation menu"} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}>
   {open?<X size={21} aria-hidden="true"/>:<Menu size={21} aria-hidden="true"/>}
  </button>
  {open&&<nav id={id} className="mobile-menu-panel" aria-label="Mobile navigation">
   {links.map(link=><Link key={`${link.href}-${link.label}`} href={link.href} onClick={()=>setOpen(false)}>{link.label}</Link>)}
  </nav>}
 </div>;
}
