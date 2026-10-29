import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthService} from '../src/v2/auth.js';
const A='1bc0d1b0-4de3-4243-964a-cf49aafee38c';
const B='7bb937c4-5be8-4dc4-9a3e-d189e0f3a1d1';
const W='717a1da0-484e-41b4-9366-a294904c5354';
const P='69c15bbd-fabf-4edf-a825-77a8db26b631';
function fakeDb({authUser={id:A,email:'verified@example.com',email_confirmed_at:'2026-09-19'},profile={id:A,role:'USER',status:'ACTIVE'},member=null,project={id:P,workspace_id:W},authError=null}={}) {
 const calls=[];
 return {calls,auth:{getUser:async(token)=>{calls.push(['verify',token]);return {data:{user:authUser},error:authError}}},
  from(table){const filters={};return {select(){return this},eq(key,value){filters[key]=value;return this},async maybeSingle(){calls.push([table,filters]);return {data:table==='users'?profile:table==='workspace_members'?member:project,error:null}}}},
  async rpc(name,args){calls.push([name,args]);return {data:{user:{id:A,role:'USER',status:'ACTIVE'}},error:null}}
 };
}
test('no token fails before accessing database or Auth',async()=>{const db=fakeDb();await assert.rejects(()=>createAuthService(db).authenticate(),e=>e.statusCode===401);assert.equal(db.calls.length,0)});
test('getUser verifies the actual token before any role is read',async()=>{const db=fakeDb();const result=await createAuthService(db).authenticate('Bearer example.jwt');assert.equal(db.calls[0][0],'verify');assert.equal(result.profile.role,'USER')});
test('invalid or expired token cannot use a cached profile',async()=>{const db=fakeDb({authError:{message:'invalid'}});await assert.rejects(()=>createAuthService(db).authenticate('Bearer invalid'),e=>e.statusCode===401);assert.equal(db.calls.length,1)});
test('unverified email cannot bootstrap an account',async()=>{const db=fakeDb({authUser:{id:A,email:'khoa3815@gmail.com',email_confirmed_at:null}});await assert.rejects(()=>createAuthService(db).authenticate('Bearer valid'),e=>e.code==='EMAIL_NOT_VERIFIED');assert.equal(db.calls.length,1)});
test('anonymous Auth sessions cannot provision workspace accounts',async()=>{const db=fakeDb({authUser:{id:A,email:'x@y.com',email_confirmed_at:'now',is_anonymous:true}});await assert.rejects(()=>createAuthService(db).authenticate('Bearer valid'),e=>e.code==='EMAIL_NOT_VERIFIED')});
test('matching super-admin email and self-supplied metadata do not grant a platform role',async()=>{const db=fakeDb({authUser:{id:B,email:'khoa3815@gmail.com',email_confirmed_at:'now',user_metadata:{role:'SUPER_ADMIN'}},profile:{id:B,role:'USER',status:'ACTIVE'}});const result=await createAuthService(db).authenticate('Bearer valid');assert.equal(result.profile.role,'USER');await assert.rejects(()=>createAuthService(db).requireSuperAdmin({user:result.profile}),e=>e.statusCode===403)});
test('suspended account is rejected on every request',async()=>{const db=fakeDb({profile:{id:A,role:'USER',status:'SUSPENDED'}});await assert.rejects(()=>createAuthService(db).authenticate('Bearer valid'),e=>e.code==='ACCOUNT_SUSPENDED')});
test('first login provisions by verified Auth ID only',async()=>{const db=fakeDb({profile:null});await createAuthService(db).authenticate('Bearer valid');assert.deepEqual(db.calls.at(-1),['datatalk_bootstrap',{p_user_id:A}])});
test('legacy invited profile is activated via trusted bootstrap, not role metadata',async()=>{const db=fakeDb({profile:{id:A,role:'USER',status:'INVITED'}});const result=await createAuthService(db).authenticate('Bearer valid');assert.equal(result.profile.status,'ACTIVE');assert.equal(db.calls.at(-1)[0],'datatalk_bootstrap')});
test('tenant B cannot read tenant A project by guessing its ID',async()=>{const db=fakeDb({member:null});const project=await createAuthService(db).projectForUser({user:{id:B,role:'USER'}},P);assert.equal(project,null);assert.deepEqual(db.calls.at(-1),['workspace_members',{workspace_id:W,user_id:B}])});
test('super admin has no implicit analytics bypass',async()=>{const db=fakeDb();assert.equal(await createAuthService(db).projectForUser({user:{id:A,role:'SUPER_ADMIN'}},P),null)});
test('viewer membership permits reading only the authorized project',async()=>{const db=fakeDb({member:{role:'VIEWER'}});const p=await createAuthService(db).projectForUser({user:{id:A,role:'USER'}},P);assert.equal(p.member_role,'VIEWER')});
test('removed membership immediately prevents next request',async()=>{const db=fakeDb({member:null});await assert.rejects(()=>createAuthService(db).membership(A,W),e=>e.code==='WORKSPACE_NOT_FOUND')});
