export default function Funnels() {
  const data = [
    ["Landing", "10,000", 100],
    ["Product", "6,200", 62],
    ["Contact", "1,116", 18],
    ["Submit", "268", 24]
  ];

  return (
    <>
      <div className="row">
        <div>
          <h1 className="title">Funnels</h1>
          <p className="subtitle">Find where important journeys slow down or break.</p>
        </div>
        <button className="btn primary">+ Create funnel</button>
      </div>

      <div style={{ height: 16 }} />

      <div className="card">
        <h2>Checkout conversion funnel</h2>
        <p className="muted">Last 30 days · 10,000 users entered</p>

        <div style={{ marginTop: 22 }}>
          {data.map(([step, users, width], index) => (
            <div key={step} style={{ marginBottom: 18 }}>
              <div className="row">
                <span>
                  <b>{step}</b> <span className="muted">· {users} users</span>
                </span>
                <b>{index === 0 ? "100%" : index === 1 ? "62%" : index === 2 ? "18%" : "24%"}</b>
              </div>
              <div className={"bar " + (index === 2 ? "danger" : "")} style={{ marginTop: 8 }}>
                <i style={{ width: `${width}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="priority" style={{ marginTop: 12 }}>
          <span className="badge high">BOTTLENECK</span>
          <h3>Product → Contact</h3>
          <p className="muted mini">
            82% of users disappear before Contact. Compare with pricing attention and session replays.
          </p>
        </div>
      </div>
    </>
  );
}
