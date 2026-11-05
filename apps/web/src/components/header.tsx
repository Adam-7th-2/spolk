"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileNavigation } from "./mobile-navigation";

const appPrefixes = ["/dashboard", "/teacher", "/admin", "/guardian", "/learn", "/classroom", "/workspace"];

export function Header() {
 const path = usePathname();
 if (appPrefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) return null;
 const mobileLinks = [
  { href: "/courses", label: "Our programs" },
  { href: "/#approach", label: "The Spolk way" },
  { href: "/#questions", label: "Good to know" },
  { href: "/about", label: "About the academy" },
  { href: "/privacy", label: "Privacy & safety" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Log in" },
 ];
 return <header className="header">
  <Link href="/" className="wordmark" aria-label="Spolk home">spolk<span>{"\u2733"}</span></Link>
  <nav aria-label="Main navigation"><Link href="/courses">Our programs</Link><Link href="/#approach">The Spolk way</Link><Link href="/#questions">Good to know</Link></nav>
  <MobileNavigation links={mobileLinks} />
  <div className="header-actions">
   <Link href="/login" className="login-link">Log in</Link>
   <Link href="/apply" className="button small">Find your course <ArrowUpRight size={16} /></Link>
  </div>
 </header>;
}

export function Footer() {
 return <footer className="footer"><div><Link href="/" className="wordmark">spolk<span>{"\u2733"}</span></Link><p>A little practice. A world of possibility.</p></div><div><Link href="/courses">Explore programs</Link><Link href="/about">About the academy</Link><Link href="/privacy">Privacy & safety</Link><Link href="/contact">Get in touch</Link></div><p className="fine">{"\u00a9"} {new Date().getFullYear()} Spolk. Grow at your own pace.</p></footer>;
}
