# DataTalk V2.2 Frontend RC8 — Gauge + Timeline Alignment

- UX Health score and `Điểm UX / UX score` label are moved to the visual center of the segmented arc.
- Previous-period copy remains outside the score overlay and does not shift the gauge center.
- Session Journey uses a dedicated marker column so every gray connector line passes exactly through the center of its purple marker.
- The final journey item does not render an unnecessary trailing line.
- Device + location + muted session-start hierarchy from RC7 is preserved.
- No backend API or database migration change is required for RC8.
