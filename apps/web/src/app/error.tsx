"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="section page-section"><h1>Something interrupted your visit.</h1><p>Please try again. Your account details haven?t been displayed.</p><button className="button" onClick={reset}>Try again</button></section>}
