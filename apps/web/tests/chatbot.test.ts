import {beforeEach,it,expect,vi} from 'vitest';
import {websiteHelp} from '../src/lib/chat-help';
const mocks=vi.hoisted(()=>({currentUser:vi.fn(),database:vi.fn()}));
vi.mock('@/lib/supabase',()=>mocks);
import {POST} from '../src/app/api/chatbot/route';
beforeEach(()=>{vi.clearAllMocks();mocks.currentUser.mockResolvedValue({id:'student'});});
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
