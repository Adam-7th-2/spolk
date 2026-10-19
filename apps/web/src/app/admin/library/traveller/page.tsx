export const dynamic="force-dynamic";
import Link from "next/link";
import {FolderLock,ChevronRight} from "lucide-react";
import {requireRole} from "@/lib/access";
import {folders} from "@/lib/traveller-library";
export default async function TravellerLibrary(){await requireRole(["admin","super_admin"]);return <section className="section page-section"><Link className="text-link" href="/admin">← Academy overview</Link><div className="eyebrow" style={{marginTop:25}}>PRIVATE ADMIN LIBRARY</div><h1>Traveller</h1><p className="lead">Books, audio, tests and teaching materials, organized by level. Only administrators can browse or download stored files.</p><div className="course-grid">{folders.map(f=><Link key={f.slug} href={`/admin/library/traveller/${f.slug}`} className="dashboard-card"><FolderLock size={30}/><h2 style={{marginTop:20,fontSize:24}}>{f.name}</h2><p>{f.resources.length} saved resource entries</p><span className="text-link">Open folder <ChevronRight size={16}/></span></Link>)}</div><p className="fine">Resource links are saved as you supplied them; external files have not been downloaded or verified. This library does not change student course access.</p></section>}
