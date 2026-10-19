import {beforeAll,afterAll,it,expect} from 'vitest';
import {resolve} from 'node:path';
import {openLocalStore,demoAccounts} from '../src/lib/local-store';
import {localRpc,LocalQuery} from '../src/lib/local-query';
let store:Awaited<ReturnType<typeof openLocalStore>>;
const student=demoAccounts[0].id,admin=demoAccounts[2].id;
beforeAll(async()=>{store=await openLocalStore('memory://',resolve('../..'));},60000);
afterAll(async()=>{await store?.db.close();});
it('records once per UTC day and notifies admins only once',async()=>{
 const first=await localRpc(store,student,'daily_checkin');
 expect(first.error).toBeNull();expect(first.data).toMatchObject({current:1,longest:1});
 expect((await localRpc(store,student,'daily_checkin')).data).toEqual(first.data);
 expect((await new LocalQuery(store,admin,'notifications').select('id').eq('event','daily_checkin')).data).toHaveLength(1);
 expect((await new LocalQuery(store,student,'notifications').select('id').eq('event','daily_checkin')).data).toHaveLength(0);
});
it('counts consecutive days, resets after gaps and preserves the best streak',async()=>{
 await store.db.query("insert into public.daily_checkins(account_id,activity_date) select $1,(now() at time zone 'UTC')::date-offset_days from unnest(array[1,2,4,5,6,7]) offset_days",[student]);
 const result=await localRpc(store,student,'daily_checkin');
 expect(result.error).toBeNull();expect(result.data).toMatchObject({current:3,longest:4});
 expect((result.data as {days:string[]}).days).toHaveLength(6);
 await store.db.query("delete from public.daily_checkins where account_id=$1 and activity_date=(now() at time zone 'UTC')::date-1",[student]);
 expect((await localRpc(store,student,'daily_checkin')).data).toMatchObject({current:1,longest:4});
});
it('blocks anonymous recording, forged dates and other students reading activity',async()=>{
 expect((await localRpc(store,null,'daily_checkin')).error?.code).toBe('42501');
 const outsider=(await store.signup('checkin-outsider@example.invalid','StrongTestPassword2026!')).id;
 expect((await new LocalQuery(store,outsider,'daily_checkins').select('*').eq('account_id',student)).data).toEqual([]);
 expect((await new LocalQuery(store,student,'daily_checkins').insert({account_id:student,activity_date:'2099-01-01'})).error?.code).toBe('42501');
});
