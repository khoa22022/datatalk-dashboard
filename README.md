# Datatalk Dashboard v1.3.2 — Trial Sandbox Proxy Fix 2

Trial UX Intelligence dashboard with Poppins, EN/VI, real charts and a live tracking sandbox.

Sandbox fix:
- The realistic scenario no longer depends on the backend `/api/try/seed` endpoint.
- It sends the complete event sequence through the same `/api/try/event` proxy used by manual controls.
- Feedback is sent after the event sequence.
- Progress and errors are visible at the top of the sandbox.
- Requests time out after 20 seconds with an actionable message.
- Summary is refreshed from the live backend after the scenario completes.

Scenario: 16 tracking events + 1 CSAT feedback submission.
