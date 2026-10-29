import test from 'node:test';
import assert from 'node:assert/strict';
let buildApp;let unavailable='';
try { ({buildApp}=await import('../src/server.js')); } catch(error) { if(error.code!=='ERR_MODULE_NOT_FOUND')throw error; unavailable='Requires npm install; dependencies unavailable in the offline build environment'; }
const A='1bc0d1b0-4de3-4243-964a-cf49aafee38c';
const fake={auth:{getUser:async()=>({data:{user:{id:A,email:'a@example.com',email_confirmed_at:'now'}}})},from(table){return {select(){return this},eq(){return this},limit(){return this},async maybeSingle(){return {data:table==='users'?{id:A,role:'USER',status:'ACTIVE'}:null}},then(resolve){resolve({data:[],error:null})}}}};
test('Fastify HTTP injection: unauthenticated, cross-workspace, admin and trial boundaries',{skip:unavailable||false},async()=>{
 const app=await buildApp({database:fake,env:{ENABLE_TRIAL_SANDBOX:'false'},logger:false});
 try{
  assert.equal((await app.inject({method:'GET',url:'/health'})).statusCode,200);
  assert.equal((await app.inject({method:'GET',url:'/api/auth/me'})).statusCode,401);
  assert.equal((await app.inject({method:'GET',url:'/api/admin/users',headers:{authorization:'Bearer example'}})).statusCode,403);
  assert.equal((await app.inject({method:'GET',url:'/api/projects?workspace_id=717a1da0-484e-41b4-9366-a294904c5354',headers:{authorization:'Bearer example'}})).statusCode,404);
  assert.equal((await app.inject({method:'POST',url:'/api/try/reset'})).statusCode,404);
 }finally{await app.close()}
});
