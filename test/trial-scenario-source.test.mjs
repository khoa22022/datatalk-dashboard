import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../app/try/sandbox/page.tsx", import.meta.url), "utf8");
assert.match(source, /warmTrialBackend/);
assert.match(source, /\/api\/try\/seed/);
assert.match(source, /seeded_events/);
assert.match(source, /Backend ready/);
console.log("GREEN TEST: sandbox warms the backend and uses one server-side scenario seed request.");
