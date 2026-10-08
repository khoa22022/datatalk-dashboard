import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('UX Health score is lowered into the visual center of the arc',()=>{
 const css=read('app/globals.css');
 assert.match(css,/\.ux-gauge-score\{position:absolute;left:50%;top:\d+px;/);
});

test('Session list prioritizes device and location, then shows muted session time',()=>{
 const s=read('app/sessions/page.tsx'); const css=read('app/globals.css');
 assert.match(s,/session-item-title/);
 assert.match(s,/session-device/);
 assert.match(s,/session-location/);
 assert.match(s,/session-started-at/);
 assert.match(s,/\{deviceLabel\(s\.device\)\}/);
 assert.match(s,/· \{location\}/);
 assert.match(css,/\.session-list-item \.session-started-at\{[^}]*font-size:10px/);
 assert.match(css,/\.session-list-item \.session-location\{[^}]*color:#8a909d/);
});
