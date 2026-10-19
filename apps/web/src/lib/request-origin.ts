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
