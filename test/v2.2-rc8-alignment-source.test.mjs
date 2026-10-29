import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('UX Health score is centered lower inside the arc',()=>{
 const css=read('app/globals.css');
 assert.match(css,/\.ux-gauge-score\{position:absolute;left:50%;top:108px;/);
});

test('journey timeline line and dot share one centered marker column',()=>{
 const page=read('app/sessions/page.tsx');
 const css=read('app/globals.css');
 assert.match(page,/className="journey-marker"/);
 assert.match(css,/\.journey-marker\{[^}]*justify-content:center/);
 assert.match(css,/\.journey-marker:after\{[^}]*left:50%/);
 assert.match(css,/transform:translateX\(-50%\)/);
 assert.match(css,/\.journey-step:last-child \.journey-marker:after\{display:none\}/);
});
