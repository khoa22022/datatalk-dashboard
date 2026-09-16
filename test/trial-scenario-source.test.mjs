import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../app/try/sandbox/page.tsx", import.meta.url), "utf8");
assert.match(source, /for\(const \[event,page,metadata\] of scenario\)/);
for (const event of ["session_start","section_view","section_heartbeat","rage_click","dead_click","task_start","task_error","task_backtrack","task_complete","session_end"]) {
  assert.match(source, new RegExp('\\["' + event + '",'));
}
assert.match(source, /method:"POST"/);
assert.match(source, /\/api\/try\/feedback/);
assert.doesNotMatch(source, /trialRequest\("\/api\/try\/seed"/);
console.log("GREEN TEST: sandbox scenario uses the event pipeline and avoids the failing seed endpoint.");
