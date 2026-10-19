import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {websiteHelp} from '../src/lib/chat-help';
const mocks=vi.hoisted(()=>({currentUser:vi.fn(),database:vi.fn(),collect:vi.fn(),complete:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/supabase',()=>mocks);
vi.mock('@/lib/course-evidence',()=>({collectCourseEvidence:mocks.collect}));
vi.mock('@/lib/gemini',()=>({GeminiProvider:class{complete=mocks.complete;}}));
import {POST} from '../src/app/api/chatbot/route';
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('GEMINI_API_KEY','');mocks.currentUser.mockResolvedValue({id:'student'});mocks.database.mockResolvedValue({rpc:mocks.rpc});});
afterEach(()=>vi.unstubAllEnvs());
const request=(question:string,origin='https://spolk.onrender.com')=>new Request('https://spolk.onrender.com/api/chatbot',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({question})});
it('rejects cross-origin requests and signed-out users',async()=>{
 expect((await POST(request('hello','https://other.example'))).status).toBe(403);
 mocks.currentUser.mockResolvedValue(null);expect((await POST(request('hello'))).status).toBe(401);
});
it('answers website questions without an AI credential or account records',async()=>{
 const r=await POST(request('Where is my homework?'));expect(r.status).toBe(200);
 expect(await r.json()).toMatchObject({mode:'Website guide',links:[{url:'/dashboard'},{url:'/workspace/notifications'}]});
 expect(mocks.database).not.toHaveBeenCalled();
});
it('rejects oversized messages',async()=>{expect((await POST(request('a'.repeat(1001)))).status).toBe(400);});
it('directs human questions to private messages and never guesses unknown answers',()=>{
 expect(websiteHelp('Contact my teacher')?.links).toEqual([{title:'Messages',url:'/workspace/messages'}]);
 expect(websiteHelp('Explain a complex poem')).toBeNull();
});
it('answers a general question using Gemini without requiring a course',async()=>{
 vi.stubEnv('GEMINI_API_KEY','test');mocks.rpc.mockResolvedValue({data:true,error:null});mocks.complete.mockResolvedValue('A black hole is a region of spacetime.');
 const r=await POST(request('Explain black holes'));expect(r.status).toBe(200);expect(await r.json()).toMatchObject({mode:'Gemini assistant',answer:'A black hole is a region of spacetime.'});expect(mocks.collect).not.toHaveBeenCalled();
});
it('does not fetch course material for unauthorized accounts',async()=>{
 vi.stubEnv('GEMINI_API_KEY','test');mocks.rpc.mockResolvedValue({data:false,error:null});
 const r=await POST(new Request('https://spolk.onrender.com/api/chatbot',{method:'POST',headers:{origin:'https://spolk.onrender.com','Content-Type':'application/json'},body:JSON.stringify({question:'Explain gravity',courseId:'00000000-0000-4000-8000-000000000001'})}));
 expect(r.status).toBe(403);expect(mocks.collect).not.toHaveBeenCalled();expect(mocks.complete).not.toHaveBeenCalled();
});
