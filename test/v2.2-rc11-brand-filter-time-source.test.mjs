import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('RC11 defaults analytics filters to Today with secondary outline active state',()=>{
 const filters=read('components/AnalyticsFilters.tsx');
 const css=read('app/globals.css');
 assert.match(filters,/defaultAnalyticsFilterValue/);
 assert.match(filters,/from:today,to:today/);
 assert.match(css,/analytics-preset\.active/);
 assert.match(css,/background:#fff/);
 assert.match(css,/color:#5d60e8/);
 for(const file of ['app/dashboard/page.tsx','app/analytics/page.tsx','app/heatmaps/page.tsx','app/sessions/page.tsx','app/tasks/page.tsx','app/feedback/page.tsx']){
   assert.match(read(file),/defaultAnalyticsFilterValue/);
 }
});

test('RC11 uses supplied DataTalk logo and canonical brand casing',()=>{
 const shell=read('components/LayoutShell.tsx');
 const auth=read('components/v2/AuthFrame.tsx');
 const layout=read('app/layout.tsx');
 assert.match(shell,/\/datatalk-logo\.png/);
 assert.match(shell,/>DataTalk</);
 assert.match(auth,/>DataTalk</);
 assert.match(layout,/title: 'DataTalk'/);
 assert.ok(fs.existsSync(new URL('../public/datatalk-logo.png',import.meta.url)));
});

test('RC11 browser time parser treats zone-less database timestamps as UTC',()=>{
 const time=read('lib/time.ts');
 const sessions=read('app/sessions/page.tsx');
 assert.match(time,/text \+= 'Z'/);
 assert.match(time,/Asia\/Ho_Chi_Minh/);
 assert.match(sessions,/formatVietnamDateTime/);
});
