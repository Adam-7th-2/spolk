import {beforeEach,it,expect,vi} from "vitest";
const fixture=vi.hoisted(()=>({role:"student",rpc:vi.fn()}));
vi.mock("@/lib/supabase",()=>({
 currentUser:async()=>({id:"a2000000-0000-4000-8000-000000000002",role:fixture.role}),
 database:async()=>({rpc:fixture.rpc}),
}));
import {POST} from "../src/app/api/assessment/route";
const request=()=>new Request("https://spolk.onrender.com/api/assessment",{
 method:"POST",
 headers:{origin:"https://spolk.onrender.com","content-type":"application/json"},
 body:JSON.stringify({action:"start",assessmentId:"a2000000-0000-4000-8000-000000000001"}),
});

beforeEach(()=>{vi.clearAllMocks();fixture.role="student";});

it.each(["student","admin"])("%s receives migration guidance when quiz RPCs are missing",async role=>{
 fixture.role=role;
 fixture.rpc.mockResolvedValue({data:null,error:{code:"PGRST202",message:"private schema details"}});
 const response=await POST(request());
 const body=await response.json();
 expect(response.status).toBe(503);
 expect(body.error).toContain("202610190001_assessment_cards.sql");
 expect(body.error).toContain("not a teacher or account-role setting");
 expect(body.error).not.toContain("private schema details");
});
