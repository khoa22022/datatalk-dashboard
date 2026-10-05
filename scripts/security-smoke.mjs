// Read-only staging checks. Provide session tokens locally; never paste them into chat.
import assert from 'node:assert/strict';
const required=['API_URL','USER_A_TOKEN','USER_B_TOKEN','USER_A_WORKSPACE_ID','USER_A_PROJECT_ID'];
for(const key of required)if(!process.env[key])throw new Error(`Missing ${key}`);
const base=process.env.API_URL.replace(/\/$/,'');
if(!/^https:\/\//.test(base)&&!/^http:\/\/(localhost|127\.0\.0\.1):/.test(base))throw new Error('Use HTTPS or localhost');
async function check(label,path,token,expected){const response=await fetch(base+path,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(70000)});assert.equal(response.status,expected,label);console.log(`PASS ${label}`)}
await check('unauthenticated denied','/api/auth/me',null,401);
await check('own workspace accessible',`/api/projects?workspace_id=${process.env.USER_A_WORKSPACE_ID}`,process.env.USER_A_TOKEN,200);
await check('other account workspace denied',`/api/projects?workspace_id=${process.env.USER_A_WORKSPACE_ID}`,process.env.USER_B_TOKEN,404);
await check('other account analytics denied',`/api/projects/${process.env.USER_A_PROJECT_ID}/overview`,process.env.USER_B_TOKEN,404);
await check('ordinary account cannot list platform users','/api/admin/users',process.env.USER_A_TOKEN,403);
console.log('READ-ONLY SMOKE CHECKS COMPLETE; this is not a full production acceptance test.');
