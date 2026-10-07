# DataTalk V2.2 RC6 — UX Health V3

## UI refinements
- UX Health card now keeps only two supporting metrics: friction events and rage/dead clicks.
- Task completion is removed from the UX Health supporting row and surfaced explicitly in the Task Efficiency card.
- UX Health gauge uses semantic colors by score status: Excellent (green), Good (teal), Needs improvement (amber), Poor/Critical (red).
- Bottom UX Health metrics are balanced in a two-column layout with improved spacing and typography.

## Data / backend
- No API or database schema change is required for this release.
- Existing task start/completion data is used to derive the Task Efficiency completion rate.
