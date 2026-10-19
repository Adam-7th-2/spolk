import {it,expect} from "vitest";
import {hasSameOrigin} from "../src/lib/request-origin";
it("accepts the browser host even when Next uses an internal localhost URL",()=>{
 expect(hasSameOrigin(new Request("http://localhost:3001/api/assessment",{headers:{host:"127.0.0.1:3001",origin:"http://127.0.0.1:3001"}}))).toBe(true);
 expect(hasSameOrigin(new Request("https://spolk.example/api/assessment",{headers:{origin:"https://spolk.example"}}))).toBe(true);
});
it("rejects missing, malformed, cross-site, scheme and port mismatches",()=>{
 for(const origin of [null,"null","https://evil.example","http://127.0.0.1:3002","https://127.0.0.1:3001","http://127.0.0.1:3001/path","http://user@127.0.0.1:3001"]){
  const headers:Record<string,string>={host:"127.0.0.1:3001"};if(origin!==null)headers.origin=origin;
  expect(hasSameOrigin(new Request("http://localhost:3001/api/assessment",{headers}))).toBe(false);
 }
});
