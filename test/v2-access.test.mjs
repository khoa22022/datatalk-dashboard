import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBearer, normalizeEmail, requireUuid, canCreateProject, canManageMember, canInvite, canChangeStatus, resultOf } from '../src/v2/access.js';
const id = '1bc0d1b0-4de3-4243-964a-cf49aafee38c';
test('bearer parsing rejects missing, malformed and oversized credentials',()=>{
 for(const header of [undefined,'','Basic abc','Bearer','Bearer a b','Bearer a\nb','Bearer '+'a'.repeat(17000)]) assert.equal(parseBearer(header),null);
 assert.equal(parseBearer('Bearer valid.jwt'), 'valid.jwt'); assert.equal(parseBearer('bearer valid.jwt'), 'valid.jwt');
});
test('email normalization is case insensitive but does not collapse aliases',()=>{
 assert.equal(normalizeEmail(' User+design@Example.com '),'user+design@example.com');
 for(const value of ['bad','a@b',{},'a b@c.com']) assert.throws(()=>normalizeEmail(value));
});
test('IDs must be UUIDs, not arbitrary tenant selectors',()=>{
 assert.equal(requireUuid(id),id);for(const value of ['undefined',null,"x' or true",'1'])assert.throws(()=>requireUuid(value));
});
for(const role of ['OWNER','ADMIN','EDITOR','VIEWER','USER','SUPER_ADMIN',null]){
 test(`project creation permission: ${role}`,()=>assert.equal(canCreateProject(role),['OWNER','ADMIN','EDITOR'].includes(role)));
}
for(const actor of ['OWNER','ADMIN','EDITOR','VIEWER']){
 for(const target of ['OWNER','ADMIN','EDITOR','VIEWER']){
  test(`member authority ${actor} over ${target}`,()=>{
   for(const next of ['ADMIN','EDITOR','VIEWER','OWNER','SUPER_ADMIN',null]){
    const expected = target!=='OWNER' && (next===null || ['ADMIN','EDITOR','VIEWER'].includes(next)) && (actor==='OWNER' || (actor==='ADMIN'&&target!=='ADMIN'&&next!=='ADMIN'));
    assert.equal(canManageMember(actor,target,next),expected,`${actor}/${target}/${next}`);
   }
  });
 }
}
test('invitation privileges do not include owner or super admin',()=>{
 assert.equal(canInvite('OWNER','ADMIN'),true);assert.equal(canInvite('ADMIN','ADMIN'),false);
 for(const actor of ['OWNER','ADMIN','EDITOR','VIEWER']) for(const role of ['OWNER','SUPER_ADMIN','USER',''])assert.equal(canInvite(actor,role),false);
});
test('system admin cannot suspend self or another super admin',()=>{
 const actor={id,role:'SUPER_ADMIN',status:'ACTIVE'};
 assert.equal(canChangeStatus(actor,actor,'SUSPENDED'),false);
 assert.equal(canChangeStatus(actor,{id:'other',role:'SUPER_ADMIN'},'SUSPENDED'),false);
 assert.equal(canChangeStatus(actor,{id:'other',role:'USER'},'SUSPENDED'),true);
 assert.equal(canChangeStatus({...actor,status:'SUSPENDED'},{id:'other',role:'USER'},'ACTIVE'),false);
 assert.equal(canChangeStatus({...actor,role:'USER'},{id:'other',role:'USER'},'SUSPENDED'),false);
});
test('database failures are sanitized and known permission errors are preserved',async()=>{
 await assert.rejects(()=>resultOf(Promise.resolve({error:{message:'sensitive SQL details',code:'XX000'}})),e=>e.code==='DATABASE_UNAVAILABLE'&&!e.message.includes('sensitive'));
 await assert.rejects(()=>resultOf(Promise.resolve({error:{message:'FORBIDDEN',code:'42501'}})),e=>e.statusCode===403);
 await assert.rejects(()=>resultOf(Promise.resolve({error:{message:'INVITATION_EXPIRED',code:'42501'}})),e=>e.code==='INVITATION_EXPIRED');
});
