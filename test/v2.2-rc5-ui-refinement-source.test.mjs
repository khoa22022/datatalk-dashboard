import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('UX health follows compact reference structure with arc score and three supporting metrics',()=>{
 const s=read('components/RealOverviewDashboard.tsx'); const css=read('app/globals.css');
 assert.match(s,/ux-arc-gauge/); assert.match(s,/Kỳ trước/); assert.match(s,/Sự kiện cản trở hành vi/); assert.match(s,/Click liên tục \/ Không phản hồi/);
 assert.match(css,/\.ux-health-visual/); assert.match(css,/\.ux-health-reference \.ux-health-metrics/);
});

test('UX priority dashboard is a compact scrollable top-five issue list with exact drill-down links',()=>{
 const s=read('components/RealOverviewDashboard.tsx'); const css=read('app/globals.css');
 assert.match(s,/slice\(0,5\)/); assert.match(s,/Không phát hiện tín hiệu/); assert.match(s,/issue=\$\{encodeURIComponent\(signal\.issueKey\)\}/); assert.match(s,/Loại/); assert.match(s,/Mức độ/); assert.match(s,/Chỉ số/);
 assert.match(css,/\.ux-priority-list\{[^}]*max-height:256px;overflow-y:auto/);
});

test('analytics period comparison uses semantic up/down classes',()=>{
 const s=read('app/analytics/page.tsx'); const css=read('app/globals.css');
 assert.match(s,/cls:v>0\?'up':v<0\?'down':'neutral'/); assert.match(s,/analytics-kpi-delta \$\{meta\.cls\}/);
 assert.match(css,/\.analytics-kpi-delta\.up/); assert.match(css,/\.analytics-kpi-delta\.down/);
});

test('heatmap hover inspector is anchored beside the hovered point and dashboard issue links resolve exactly',()=>{
 const s=read('app/heatmaps/page.tsx'); const css=read('app/globals.css');
 assert.match(s,/onMouseEnter/); assert.match(s,/onMouseLeave/); assert.match(s,/pos:\{x:number;y:number\}/); assert.match(s,/selectedIssueKey/); assert.match(s,/displayedIssues/);
 assert.match(css,/\.heatmap-point-inspector\.right\.above/); assert.match(css,/\.heatmap-point-inspector\.left\.below/);
});
