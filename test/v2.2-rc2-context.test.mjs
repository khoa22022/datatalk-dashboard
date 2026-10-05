import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pageIdentity, buildSessionJourneys } from '../src/v2/analytics-v22.js';

test('page identity rejects path-shaped page names and keeps a meaningful title',()=>{
 const row=pageIdentity({page:'/',metadata:{page_path:'/',page_name:'/',page_title:'Tan Khoa Port',page_url:'https://example.com/'}});
 assert.equal(row.pageName,'Tan Khoa Port'); assert.equal(row.pagePath,'/');
});
test('session journey exposes page names and page count',()=>{
 const events=[
  {id:'1',event:'page_view',created_at:'2026-10-05T00:00:00Z',session_id:'s1',visitor_id:'u1',page:'/',metadata:{page_title:'Home'}},
  {id:'2',event:'click',created_at:'2026-10-05T00:00:02Z',session_id:'s1',visitor_id:'u1',page:'/pricing',element_text:'Buy',metadata:{page_title:'Pricing'}}
 ];
 const out=buildSessionJourneys(events,[])[0]; assert.equal(out.pageCount,2); assert.equal(out.firstPageName,'Home'); assert.equal(out.lastPageName,'Pricing');
});
test('generated SDK captures document coordinates and page naming metadata',()=>{
 const s=fs.readFileSync(new URL('../src/v2/sdk-v22.js',import.meta.url),'utf8');
 assert.match(s,/document_x/); assert.match(s,/document_height/); assert.match(s,/data-datatalk-page-name/); assert.match(s,/page_route_group/);
});
