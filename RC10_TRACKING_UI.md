# DataTalk V2.2 RC10 - Tracking UI

- Session timestamps continue to render in `Asia/Ho_Chi_Minh`, now backed by validated browser occurrence time from RC10 backend.
- Location uses city/region/country returned by the backend when available.
- Long page, route, task, and journey labels are clamped/ellipsized to prevent overflow; full text remains available via native hover title.
- Task Efficiency continues to consume automatic CTA task data, including same-URL React view transitions.
