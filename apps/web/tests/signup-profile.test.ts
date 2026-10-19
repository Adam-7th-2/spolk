import {beforeAll,afterAll,it,expect} from 'vitest';
import {resolve} from 'node:path';
import {openLocalStore} from '../src/lib/local-store';
import {LocalQuery} from '../src/lib/local-query';
let store:Awaited<ReturnType<typeof openLocalStore>>;
beforeAll(async()=>{store=await openLocalStore('memory://',resolve('../..'));},60000);
afterAll(async()=>{await store?.db.close();});
it('saves signup details before login and ignores roles supplied in metadata',async()=>{
 const user=await store.signup('profile-signup@example.invalid','StrongPassword2026!',{first_name:' Hana ',last_name:'Tesfaye',country:'Ethiopia',city:'Addis Ababa',timezone:'Africa/Addis_Ababa',english_level:'B1',learning_goal:'Speak confidently at work.',interface_language:'en',explanation_language:'am',email_notifications:true,role:'super_admin'});
 const profile=await new LocalQuery(store,user.id,'profiles').select('*').eq('id',user.id).single();
 expect(profile.error).toBeNull();expect(profile.data).toMatchObject({first_name:'Hana',last_name:'Tesfaye',display_name:'Hana Tesfaye',country:'Ethiopia',city:'Addis Ababa',timezone:'Africa/Addis_Ababa',english_level:'B1',email_notifications:true});
 expect((await new LocalQuery(store,user.id,'user_roles').select('role')).data).toEqual([{role:'student'}]);
});
it('keeps safe defaults for missing or invalid metadata and respects email opt-out',async()=>{
 const user=await store.signup('profile-default@example.invalid','StrongPassword2026!',{timezone:'not-a-zone',english_level:'admin',interface_language:'invalid'});
 expect((await new LocalQuery(store,user.id,'profiles').select('*').single()).data).toMatchObject({display_name:'Learner',timezone:'UTC',english_level:'Not sure',interface_language:'en',email_notifications:false});
});
