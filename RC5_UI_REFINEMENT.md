# DataTalk V2.2 RC5 - UI Refinement

This release implements the latest UI refinements from product review:

- UX Health card follows the supplied reference structure: compact status badge, segmented arc score, previous-period score comparison, and three supporting UX metrics.
- UX Priority on Overview is now a compact, scrollable Top 5 list with Type, Severity, Page, and Metric. Empty state: `Không phát hiện tín hiệu`.
- Clicking a UX Priority row deep-links to the exact matching UX issue in Interaction Map.
- Analytics previous-period deltas now use visible semantic trend colors: increase = green, decrease = red, unchanged/no previous data = neutral.
- Heatmap hover inspector now appears next to the hovered point, automatically flips near edges, and supports click-to-pin behavior.

No mock production analytics were added.
