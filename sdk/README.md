# Datatalk SDK v1.3.1

Web SDK is served by the backend at `/sdk/datatalk.js`.

```html
<script src="https://datatalk-api-h4a1.onrender.com/sdk/datatalk.js" data-project="YOUR_TRACKING_KEY" data-endpoint="https://datatalk-api-h4a1.onrender.com"></script>
```

## Automatic tracking
- session_start / session_end
- page_view / page_heartbeat / page_visible / page_hidden / page_dwell
- section_view / section_heartbeat / section_exit via `[data-datatalk-section]`
- click / rage_click / dead_click
- scroll depth

## Task API
```js
DatatalK.taskStart('checkout');
DatatalK.taskStep('checkout', 'shipping');
DatatalK.taskError('checkout', 'payment', { code: 'invalid_card' });
DatatalK.taskBacktrack('checkout', 'payment', 'shipping');
DatatalK.taskComplete('checkout');
```

Custom events:
```js
DatatalK.track('experiment_exposed', { variant: 'B' });
DatatalK.identify('user-123', { plan: 'pro' });
```
