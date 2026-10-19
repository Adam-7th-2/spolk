import type { Metadata } from "next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { Header, Footer } from "@/components/header";
export const dynamic = "force-dynamic";
export const metadata:Metadata={title:{default:"Spolk ? Find your voice in English",template:"%s | Spolk"},description:"English learning with a human connection. Explore purposeful programs, live lessons, and a learning path that fits your life."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body suppressHydrationWarning><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main">{children}</main><Footer/></body></html>}
