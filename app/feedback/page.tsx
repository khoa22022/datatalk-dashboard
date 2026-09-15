export default function Feedback() {
  const cards = [
    ["CSAT", "4.2 / 5", "↑ 0.3"],
    ["NPS", "+42", "↑ 8"],
    ["CES", "5.8 / 7", "↓ 0.4"],
    ["Responses", "1,284", "31% rate"]
  ];

  const feedback = [
    ["Pricing", "I couldn't tell which plan was right for me.", "Negative"],
    ["Checkout", "Payment took too long.", "Negative"],
    ["Homepage", "The navigation is really easy.", "Positive"],
    ["Product", "I wanted more detail before buying.", "Neutral"]
  ];

  const concentration = [
    ["Pricing", 72],
    ["Checkout", 61],
    ["Product", 34],
    ["Homepage", 12]
  ];

  return (
    <>
      <div className="row">
        <div>
          <h1 className="title">Feedback</h1>
          <p className="subtitle">Connect what users say with where and how they behave.</p>
        </div>
        <button className="btn primary">Create survey</button>
      </div>

      <div style={{ height: 16 }} />

      <div className="grid4">
        {cards.map(([label, value, trend]) => (
          <div className="card" key={label}>
            <div className="label">{label}</div>
            <div className="metric">{value}</div>
            <div className="trend up">{trend}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }} />

      <div className="grid2">
        <div className="card">
          <h2>Recent feedback</h2>
          <div className="section-list" style={{ marginTop: 14 }}>
            {feedback.map(([page, text, sentiment]) => (
              <div key={page} style={{ padding: "12px 0", borderBottom: "1px solid #eef0f3" }}>
                <div className="row">
                  <b>{page}</b>
                  <span className={"badge " + (sentiment === "Negative" ? "high" : "good")}>
                    {sentiment}
                  </span>
                </div>
                <p className="muted mini">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Feedback concentration</h2>
          <p className="muted">Pages with the most negative feedback.</p>

          {concentration.map(([page, value]) => (
            <div key={page} style={{ marginTop: 16 }}>
              <div className="row mini">
                <b>{page}</b>
                <b>{value}%</b>
              </div>
              <div className="bar danger">
                <i style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
