import {beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({currentUser:vi.fn(),database:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/supabase',()=>mocks);
import {POST} from '../src/app/api/daily-checkin/route';
beforeEach(()=>{vi.clearAllMocks();mocks.currentUser.mockResolvedValue({id:'student'});mocks.database.mockResolvedValue({rpc:mocks.rpc});});
it('rejects cross-origin requests before writing attendance',async()=>{
 const response=await POST(new Request('https://spolk.onrender.com/api/daily-checkin',{method:'POST',headers:{origin:'https://other.example'}}));
 expect(response.status).toBe(403);expect(mocks.rpc).not.toHaveBeenCalled();
});
it('requires a signed-in account',async()=>{
 mocks.currentUser.mockResolvedValue(null);
 const response=await POST(new Request('https://spolk.onrender.com/api/daily-checkin',{method:'POST',headers:{origin:'https://spolk.onrender.com'}}));
 expect(response.status).toBe(401);expect(mocks.rpc).not.toHaveBeenCalled();
});
it('reports an unavailable migration without exposing database details',async()=>{
 mocks.rpc.mockResolvedValue({data:null,error:{message:'private database details'}});
 const response=await POST(new Request('https://spolk.onrender.com/api/daily-checkin',{method:'POST',headers:{origin:'https://spolk.onrender.com'}}));
 expect(response.status).toBe(503);expect(await response.text()).not.toContain('private database details');
});
