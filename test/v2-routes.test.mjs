import test from 'node:test';
import assert from 'node:assert/strict';
import {registerAccountRoutes} from '../src/v2/routes.js';
import {ApiError} from '../src/v2/access.js';
const A='1bc0d1b0-4de3-4243-964a-cf49aafee38c',W='717a1da0-484e-41b4-9366-a294904c5354';
function setup(role='OWNER'){
 const routes=new Map(),calls=[];
 const app={};for(const method of ['get','post','patch','delete'])app[method]=(path,opts,handler)=>routes.set(`${method} ${path}`,{opts,handler});
 const db={rpc:async(name,args)=>{calls.push({name,args});return {data:{id:W},error:null}},from(){throw new Error('Unexpected unscoped database query')}};
 const auth={requireUser:async request=>{if(!request.user)throw new ApiError(401,'AUTH_REQUIRED')},requireSuperAdmin:async request=>{if(request.user?.role!=='SUPER_ADMIN')throw new ApiError(403,'FORBIDDEN')},membership:async()=>({role,workspace_id:W})};
 registerAccountRoutes(app,db,auth);
 async function run(method,path,{body,params={},query={},user={id:A,role:'USER'}}={}){const {opts,handler}=routes.get(`${method} ${path}`);const request={body,params,query,user};const reply={code(){return this}};for(const hook of Array.isArray(opts.preHandler)?opts.preHandler:[opts.preHandler])await hook(request,reply);return handler(request,reply)}
 return {routes,calls,run};
}
test('every V2 account/management route has server authentication',()=>{for(const route of setup().routes.values())assert.ok(route.opts.preHandler)});
test('project handler uses authenticated actor and explicit workspace, ignoring forged user and role fields',async()=>{
 const ctx=setup();await ctx.run('post','/api/projects',{body:{name:'Test',workspace_id:W,user_id:'attacker',role:'SUPER_ADMIN',tracking_key:'forged'}});
 assert.equal(ctx.calls[0].args.p_actor,A);assert.equal(ctx.calls[0].args.p_workspace,W);assert.equal(ctx.calls[0].args.role,undefined);assert.equal(ctx.calls[0].args.tracking_key,undefined);
});
test('project creation rejects an absent workspace instead of using the first arbitrary membership',async()=>{
 const ctx=setup();await assert.rejects(()=>ctx.run('post','/api/projects',{body:{name:'Test'}}),e=>e.code==='INVALID_ID');assert.equal(ctx.calls.length,0);
});
test('invitation handler rejects an editor before writing anything',async()=>{
 const ctx=setup('EDITOR');await assert.rejects(()=>ctx.run('post','/api/workspaces/:workspaceId/invitations',{params:{workspaceId:W},body:{email:'other@example.com',role:'VIEWER'}}),e=>e.statusCode===403);assert.equal(ctx.calls.length,0);
});
test('workspace admin cannot invite a peer administrator',async()=>{
 const ctx=setup('ADMIN');await assert.rejects(()=>ctx.run('post','/api/workspaces/:workspaceId/invitations',{params:{workspaceId:W},body:{email:'other@example.com',role:'ADMIN'}}),e=>e.statusCode===403);
});
test('invitation response does not claim an email was sent',async()=>{
 const ctx=setup();const result=await ctx.run('post','/api/workspaces/:workspaceId/invitations',{params:{workspaceId:W},body:{email:' Other@Example.com ',role:'VIEWER'}});assert.equal(result.email_sent,false);assert.equal(ctx.calls[0].args.p_email,'other@example.com');
});
test('ordinary user cannot call the status-management endpoint',async()=>{
 const ctx=setup();await assert.rejects(()=>ctx.run('patch','/api/admin/users/:id/status',{params:{id:A},body:{status:'SUSPENDED'}}),e=>e.statusCode===403);
});
test('V1 platform role escalation route is disabled even for a super admin',async()=>{
 const ctx=setup();await assert.rejects(()=>ctx.run('patch','/api/admin/users/:id/role',{user:{id:A,role:'SUPER_ADMIN'},params:{id:A},body:{role:'SUPER_ADMIN'}}),e=>e.code==='PLATFORM_ROLE_MANAGED_IN_DATABASE');assert.equal(ctx.calls.length,0);
});
