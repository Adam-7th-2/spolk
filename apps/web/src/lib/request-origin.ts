/** The address the browser can open. Render's internal request URL is https://0.0.0.0:$PORT. */
export function publicOrigin(request: Request): string {
 const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL;
 if (configured) {
  try { return new URL(configured).origin; } catch { /* Use the forwarded host below. */ }
 }
 const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
 const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
 if (forwarded && !forwarded.startsWith("0.0.0.0")) return `${proto}://${forwarded}`;
 const url = new URL(request.url);
 return url.hostname === "0.0.0.0" ? "http://localhost:3000" : url.origin;
}

/** Next's internal request URL can use localhost while the browser uses 127.0.0.1. */
export function hasSameOrigin(request:Request):boolean{
 const supplied=request.headers.get("origin");
 if(!supplied)return false;
 try{
  const origin=new URL(supplied),target=new URL(request.url);
  const configured=process.env.NEXT_PUBLIC_SITE_URL||process.env.RENDER_EXTERNAL_URL;
  if(configured)return supplied===origin.origin&&origin.origin===new URL(configured).origin;
  const host=request.headers.get("host")??target.host;
  return supplied===origin.origin&&origin.protocol===target.protocol&&origin.host===host.toLowerCase();
 }catch{return false;}
}
