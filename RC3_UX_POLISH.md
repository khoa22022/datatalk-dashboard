# DataTalk V2.2 Frontend RC3 — UX polish

This release folds the latest product-review backlog into the real-data UI.

## Included
- Quick-filter title now uses the same typography hierarchy as From/To date labels.
- Today/7 days/30 days retain an explicit selected state.
- UX Health now renders real `100 - unique UX issues` data once tracking exists.
- Premium segmented UX Health gauge with status, previous-period delta and supporting friction/task metrics.
- Vietnamese analytics labels no longer expose the main English metric labels such as Dwell/Rage/Dead/Scroll.
- Page identity helper displays a readable page name with the path as secondary context.
- Analytics page chart and table use readable page names instead of `/` alone.
- Heatmap requires a page context and a device layout context before drawing coordinate-based points.
- Heatmap exposes desktop/mobile/tablet availability from real data and point details on hover/focus/click.
- Session list/detail replaces ambiguous `--` metadata with explicit missing-data messages and readable action labels.

## Data rule
No production metric is filled with demo/mock values. Missing values remain `--` or an explicit empty-state message.
