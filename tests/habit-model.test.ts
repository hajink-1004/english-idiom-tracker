import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addDays,challengeDays,dayNumber,dateKey,DAYS,emptyStore,updateRecord,statistics,decodeStore,canEdit} from '../src/model.ts';
const complete={idioms:['break the ice','keep in touch'] as [string,string],status:'complete' as const};
const minimum={idioms:['break the ice',''] as [string,string],status:'minimum' as const};
test('fixed dates and weekday, month/year/leap transitions',()=>{
 assert.equal(DAYS[0],'2026-10-17');assert.equal(DAYS[6],'2026-10-23');
 assert.equal(new Date(DAYS[0]+'T12:00:00Z').getUTCDay(),6);
 assert.deepEqual(challengeDays('2026-12-30',4),['2026-12-30','2026-12-31','2027-01-01','2027-01-02']);
 assert.equal(addDays('2028-02-28',1),'2028-02-29');assert.equal(dayNumber('2026-12-31','2027-01-01'),2);
 assert.equal(dateKey(new Date(2026,9,17,23,59)), '2026-10-17');
});
test('only today in challenge is writable; overnight stale selection is blocked',()=>{
 for(const [selected,today] of [['2026-10-18','2026-10-17'],['2026-10-17','2026-10-18'],['2026-10-16','2026-10-16'],['2026-10-24','2026-10-24']]){
  assert.equal(canEdit(selected,today),false);assert.throws(()=>updateRecord(emptyStore(),selected,today,complete));
 }
});
test('real records, replacement, minimum counts fully, missed reverses progress and streak',()=>{
 let store=updateRecord(emptyStore(),DAYS[0],DAYS[0],complete);
 assert.deepEqual(statistics(store.records,DAYS[0]),{completed:1,percent:14,streak:1});
 store=updateRecord(store,DAYS[0],DAYS[0],minimum);
 assert.equal(Object.keys(store.records).length,1);assert.equal(statistics(store.records,DAYS[0]).percent,14);
 store=updateRecord(store,DAYS[0],DAYS[0],{...minimum,status:'missed'});
 assert.deepEqual(statistics(store.records,DAYS[0]),{completed:0,percent:0,streak:0});
});
test('streak uses previous day until today is recorded; includes minimum, breaks on missed/gap',()=>{
 let store=updateRecord(emptyStore(),DAYS[0],DAYS[0],complete);
 assert.equal(statistics(store.records,DAYS[1]).streak,1);
 store=updateRecord(store,DAYS[1],DAYS[1],minimum);
 assert.deepEqual(statistics(store.records,DAYS[1]),{completed:2,percent:29,streak:2});
 assert.equal(statistics(store.records,DAYS[3]).streak,0);
 store=updateRecord(store,DAYS[2],DAYS[2],{...minimum,status:'missed'});
 assert.equal(statistics(store.records,DAYS[2]).streak,0);
});
test('all seven successful days and end-of-challenge statistics',()=>{
 let store=emptyStore();for(const day of DAYS)store=updateRecord(store,day,day,minimum);
 assert.deepEqual(statistics(store.records,'2026-10-24'),{completed:7,percent:100,streak:7});
 assert.deepEqual(statistics(store.records,'2026-10-16'),{completed:0,percent:0,streak:0});
});
test('serialization restores config and idioms, invalid record rejected, draft not counted',()=>{
 let store=updateRecord(emptyStore(),DAYS[0],DAYS[0],complete);
 assert.deepEqual(decodeStore(JSON.stringify(store)),store);
 assert.throws(()=>decodeStore('{broken'));
 assert.throws(()=>updateRecord(store,DAYS[0],DAYS[0],{...minimum,status:'complete'}));
 store=updateRecord(store,DAYS[0],DAYS[0],{...minimum,status:null});
 assert.equal(statistics(store.records,DAYS[0]).completed,0);
});
