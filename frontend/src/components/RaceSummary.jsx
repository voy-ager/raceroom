export default function RaceSummary({ summary, onDriverClick }) {
  const teamColors = {
    "Red Bull Racing": "#3671C6",
    "Ferrari": "#E8002D",
    "Mercedes": "#27F4D2",
    "McLaren": "#FF8000",
    "Aston Martin": "#229971",
    "Alpine": "#FF87BC",
    "Williams": "#64C4FF",
    "AlphaTauri": "#6692FF",
    "Alfa Romeo": "#C92D4B",
    "Haas F1 Team": "#B6BABD",
  };

  const getTeamColor = (team) =>
    teamColors[team] || "#888";

  return (
    <div className="race-summary">
      {/* Race Header */}
      <div className="race-header">
        <div>
          <h2 className="race-title">
            {summary.year} {summary.event} Grand Prix
          </h2>
          <div className="race-meta">
            <span>🌡️ {summary.weather}</span>
            <span>👥 {summary.total_drivers} drivers</span>
            {summary.winner && (
              <span>🏆 Winner: {summary.winner.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Driver Grid */}
      <div className="driver-grid">
        {summary.drivers.map((driver) => (
          <button
            key={driver.code}
            className="driver-card"
            onClick={() => onDriverClick(driver.code)}
            style={{ borderTopColor: getTeamColor(driver.team) }}
          >
            <div className="driver-position">
              P{driver.final_position}
            </div>
            <div className="driver-info">
              <span className="driver-code">{driver.code}</span>
              <span className="driver-name">{driver.name}</span>
              <span
                className="driver-team"
                style={{ color: getTeamColor(driver.team) }}
              >
                {driver.team}
              </span>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .race-summary { margin-bottom: 8px; }

        .race-header {
          background: #1a1a2e;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .race-title {
          font-size: 28px;
          font-weight: 800;
          color: white;
          margin-bottom: 8px;
        }

        .race-meta {
          display: flex;
          gap: 20px;
          color: #888;
          font-size: 14px;
        }

        .driver-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 32px;
        }

        .driver-card {
          background: #1a1a2e;
          border: 1px solid #222;
          border-top: 3px solid #888;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .driver-card:hover {
          background: #22223a;
          transform: translateY(-2px);
          border-color: #444;
        }

        .driver-position {
          font-size: 20px;
          font-weight: 800;
          color: #e10600;
          min-width: 32px;
        }

        .driver-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .driver-code {
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        .driver-name {
          font-size: 11px;
          color: #666;
        }

        .driver-team {
          font-size: 11px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}