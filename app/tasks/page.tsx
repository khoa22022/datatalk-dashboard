export default function Tasks() {
  const steps = [
    ["Cart", "18s", 92],
    ["Shipping", "42s", 81],
    ["Payment", "1m 28s", 58],
    ["Success", "11s", 99]
  ];

  const cards = [
    ["Task success", "68%", "↓ 6.2%"],
    ["Median completion", "2m 18s", "↑ 24%"],
    ["Backtracking", "18%", "↑ 7.1%"],
    ["Error rate", "11%", "↑ 2.8%"]
  ];

  return (
    <>
      <div className="row">
        <div>
          <h1 className="title">Task efficiency</h1>
          <p className="subtitle">
            Measure speed, success and friction across important user flows.
          </p>
        </div>
        <select className="select">
          <option>Checkout</option>
          <option>Signup</option>
          <option>Contact</option>
        </select>
      </div>

      <div style={{ height: 16 }} />

      <div className="grid4">
        {cards.map(([label, value, trend]) => (
          <div className="card" key={label}>
            <div className="label">{label}</div>
            <div className="metric">{value}</div>
            <div className="trend down">{trend}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }} />

      <div className="card">
        <h2>Checkout task timeline</h2>
        <p className="muted">
          Where users spend the time needed to complete the task.
        </p>

        <div className="section-list" style={{ marginTop: 18 }}>
          {steps.map(([step, duration, efficiency]) => (
            <div className="section-item" key={step}>
              <b>{step}</b>
              <div className="bar">
                <i style={{ width: `${100 - Number(efficiency) + 35}%` }} />
              </div>
              <b>{duration}</b>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div className="grid2">
        <div className="card">
          <h2>Efficiency signals</h2>
          <div className="section-list" style={{ marginTop: 14 }}>
            <div className="row"><span>Expected clicks</span><b>7</b></div>
            <div className="row"><span>Actual clicks</span><b>12.4</b></div>
            <div className="row"><span>Extra interactions</span><b className="down">+77%</b></div>
            <div className="row"><span>Median first interaction</span><b>8.2s</b></div>
          </div>
        </div>

        <div className="card">
          <h2>Priority</h2>
          <div className="priority">
            <span className="badge high">HIGH</span>
            <h3>Payment step is 2.8× slower</h3>
            <p className="muted mini">
              63% of total task time is spent on Payment. Compare replay and
              heatmap before redesign.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
