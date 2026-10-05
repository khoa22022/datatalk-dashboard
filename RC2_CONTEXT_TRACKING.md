# DataTalk V2.2 Backend RC2 — page/device/session context

## Included
- Web SDK captures stronger page identity: manual page name, H1, document title, page path.
- SPA route changes wait briefly for the next rendered page title before emitting the page view.
- Click events now capture document-space coordinates in addition to viewport coordinates.
- Click metadata includes document dimensions and element bounds to make scrollable-page heatmaps meaningful.
- Dashboard exposes UX-health delta and a separate page catalog.
- Analytics exposes a stable page catalog while metrics honor the selected page/device filter.
- Heatmap API returns page catalog, device availability, device-aware interaction points, document coordinates and element context.
- Session journey API returns readable page names, page count and first/last meaningful actions.

No new database migration is required beyond V2.2 `v2.2_product_analytics.sql`.
