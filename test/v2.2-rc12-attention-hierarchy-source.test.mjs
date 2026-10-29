import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const heat=fs.readFileSync(new URL('../app/heatmaps/page.tsx',import.meta.url),'utf8');
const tasks=fs.readFileSync(new URL('../app/tasks/page.tsx',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');

test('RC12 attention mode renders section heatmap evidence and ranking',()=>{
  for(const token of ['attention-page-wireframe','avgAttentionMs','fastScrollRate','revisitRate','scrollStops','Mức chú ý theo section']) assert.ok(heat.includes(token),token);
});

test('RC12 task UI exposes completion summary and decision evidence',()=>{
  for(const token of ['task-summary-strip','Tỷ lệ hoàn thành','Cân nhắc trước CTA','Điểm ý định','Phiên tìm tín hiệu tin cậy']) assert.ok(tasks.includes(token),token);
});

test('RC12 global card hierarchy tokens are present',()=>{
  for(const token of ['--dt-card-title','--dt-card-copy','.card-header h2','.attention-map-grid','.task-intent-meta']) assert.ok(css.includes(token),token);
});
