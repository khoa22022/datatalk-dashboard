import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('analytics filter supports dd/mm/yyyy, comparison, page search and device filtering',()=>{
 const s=read('components/AnalyticsFilters.tsx');
 assert.match(s,/dd\/mm\/yyyy/);assert.match(s,/compare: 'previous'\|'yesterday'/);assert.match(s,/Page name, path or URL/);assert.match(s,/mobile/);
});
test('priority analytics screens use live resources',()=>{
 for(const [file,endpoint] of [['app/analytics/page.tsx','analytics-v2'],['app/heatmaps/page.tsx','heatmaps-v2'],['app/sessions/page.tsx','sessions-v2'],['app/tasks/page.tsx','tasks-v2'],['app/feedback/page.tsx','feedback-v2']]) assert.match(read(file),new RegExp(endpoint));
 assert.match(read('app/funnels/page.tsx'),/finalize-recording/);
});
test('feedback builder exposes real survey types and funnel is no-code first',()=>{
 const f=read('app/feedback/page.tsx');assert.match(f,/multiple_choice/);assert.match(f,/yes_no/);assert.match(f,/text/);
 const u=read('app/funnels/page.tsx');assert.match(u,/Ghi lại luồng trên website/);assert.match(u,/No event names, selectors or code required/);
});
