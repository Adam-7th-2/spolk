import {afterEach,it,expect,vi} from 'vitest';
import {GeminiProvider} from '../src/lib/gemini';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it('keeps keys in server headers and sends system instructions separately from history',async()=>{
 vi.stubEnv('GEMINI_API_KEY','secret-test-key');vi.stubEnv('GEMINI_MODEL','gemini-3.5-flash-lite');
 const fetcher=vi.fn().mockResolvedValue(Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'private thought',thought:true},{text:'Hello!'}]}}]}));vi.stubGlobal('fetch',fetcher);
 expect(await new GeminiProvider().complete([{role:'system',content:'Rules'},{role:'user',content:'Hi'},{role:'assistant',content:'Hello'},{role:'user',content:'Explain gravity'}])).toBe('Hello!');
 const[url,options]=fetcher.mock.calls[0];expect(url).not.toContain('secret-test-key');expect(options.headers['x-goog-api-key']).toBe('secret-test-key');const body=JSON.parse(options.body);expect(body.systemInstruction.parts[0].text).toBe('Rules');expect(body.contents.map((c:{role:string})=>c.role)).toEqual(['user','model','user']);
});
it('fails clearly without a key, on quota exhaustion and on empty responses',async()=>{
 vi.stubEnv('GEMINI_API_KEY','');await expect(new GeminiProvider().complete([])).rejects.toThrow('not configured');vi.stubEnv('GEMINI_API_KEY','secret-test-key');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status:429})));await expect(new GeminiProvider().complete([])).rejects.toThrow('limit');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({candidates:[]})));await expect(new GeminiProvider().complete([])).rejects.toThrow('did not return');
});
