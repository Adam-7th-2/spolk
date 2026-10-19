import {beforeEach,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({error:null as null|{code?:string;status?:number;name?:string},login:vi.fn(),signup:vi.fn()}));
vi.mock("@/lib/supabase",()=>({isConfigured:()=>true,database:async()=>({auth:{signInWithPassword:state.login,signUp:state.signup}})}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error('REDIRECT '+url)}}));
import {authenticate} from "../src/app/auth/actions";
function form(mode='login',password='short-existing-password'){const f=new FormData();f.set('mode',mode);f.set('email','  learner@example.org  ');f.set('password',password);return f}
beforeEach(()=>{vi.restoreAllMocks();state.login.mockReset().mockImplementation(async()=>({error:state.error}));state.signup.mockReset().mockResolvedValue({error:null});state.error=null});
it("allows existing short passwords at sign-in and trims only the email",async()=>{await expect(authenticate({message:'',error:false},form('login',' six '))).rejects.toThrow('REDIRECT /dashboard');expect(state.login).toHaveBeenCalledWith({email:'learner@example.org',password:' six '})});
it("retains the twelve-character rule for new passwords",async()=>{const result=await authenticate({message:'',error:false},form('register','short'));expect(result.error).toBe(true);expect(state.signup).not.toHaveBeenCalled()});
it("explains unverified email without reporting incorrect credentials",async()=>{vi.spyOn(console,'error').mockImplementation(()=>{});state.error={code:'email_not_confirmed',status:400};const result=await authenticate({message:'',error:false},form());expect(result.message).toContain('Confirm your email')});
it("distinguishes connectivity failures and logs no credentials",async()=>{const log=vi.spyOn(console,'error').mockImplementation(()=>{});state.error={name:'AuthRetryableFetchError',status:0};const result=await authenticate({message:'',error:false},form());expect(result.message).toContain('could not be reached');expect(JSON.stringify(log.mock.calls)).not.toContain('learner@example.org');expect(JSON.stringify(log.mock.calls)).not.toContain('short-existing-password')});
it("rejects unknown actions without sending credentials",async()=>{const result=await authenticate({message:'',error:false},form('other'));expect(result.error).toBe(true);expect(state.login).not.toHaveBeenCalled()});
