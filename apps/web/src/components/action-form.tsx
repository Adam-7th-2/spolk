"use client";
import Link from "next/link";
import {useActionState,useEffect} from "react";
type State={message:string;error:boolean;href?:string};
export function ActionForm({action,children,label}:{action:(state:State,form:FormData)=>Promise<State>;children:React.ReactNode;label:string}){const[state,dispatch,pending]=useActionState(action,{message:"",error:false});useEffect(()=>{if(state.message&&!state.error)window.dispatchEvent(new Event("workspace-updated"));},[state]);return <form action={dispatch}>{children}{state.message&&<p role="status" className={`status ${state.error?"error":""}`}>{state.message}</p>}{!state.error&&state.href?.startsWith("/workspace/messages/")&&<Link className="text-link" href={state.href}>Open conversation</Link>}<button className="button small" disabled={pending}>{pending?"Saving…":label}</button></form>}
