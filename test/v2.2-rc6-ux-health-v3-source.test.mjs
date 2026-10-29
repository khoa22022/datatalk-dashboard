import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('UX Health V3 keeps only two supporting metrics and removes task completion from the card',()=>{
 const s=read('components/RealOverviewDashboard.tsx');
 const block=s.slice(s.indexOf('function UXHealthCard'),s.indexOf('function Metric'));
 assert.match(block,/Sự kiện cản trở hành vi/);
 assert.match(block,/Click liên tục \/ Không phản hồi/);
 assert.doesNotMatch(block,/Tỷ lệ hoàn thành tác vụ/);
 assert.doesNotMatch(block,/taskSuccess/);
});

test('UX Health V3 uses semantic gauge colors for each status band',()=>{
 const css=read('app/globals.css');
 assert.match(css,/\.ux-health-card\.excellent \.ux-arc-gauge line\.on\{stroke:#2fbf71\}/);
 assert.match(css,/\.ux-health-card\.good \.ux-arc-gauge line\.on\{stroke:#22a6a1\}/);
 assert.match(css,/\.ux-health-card\.warning \.ux-arc-gauge line\.on\{stroke:#f0a62e\}/);
 assert.match(css,/\.ux-health-card\.critical \.ux-arc-gauge line\.on\{stroke:#d64a58\}/);
 assert.match(css,/\.ux-health-reference \.ux-health-metrics\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('Task efficiency explicitly shows completion rate',()=>{
 const s=read('components/RealOverviewDashboard.tsx');
 const block=s.slice(s.indexOf('function TaskCard'),s.indexOf('function DeviceCard'));
 assert.match(block,/Tỷ lệ hoàn thành/);
 assert.match(block,/completionRate/);
 assert.match(block,/completes\/starts/);
});
