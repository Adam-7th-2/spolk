"use client";
import {useActionState} from "react";
type State={message:string;error:boolean};
export function ActionForm({action,children,label}:{action:(state:State,form:FormData)=>Promise<State>;children:React.ReactNode;label:string}){const[state,dispatch,pending]=useActionState(action,{message:"",error:false});return <form action={dispatch}>{children}{state.message&&<p role="status" className={`status ${state.error?"error":""}`}>{state.message}</p>}<button className="button small" disabled={pending}>{pending?"Saving…":label}</button></form>}
