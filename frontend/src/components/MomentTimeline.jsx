import { useState, useEffect } from "react";
import axios from "axios";

export default function MomentTimeline({ race, api }) {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!race) return;
    setLoading(true);
    axios
      .get(`${api}/race/${race.year}/${race.name}/moments`)
      .then((res) => {
        setMoments(res.data.moments);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [race, api]);

  const filtered = filter === "all"
    ? moments
    : moments.filter((m) => m.type === filter);

  if (loading) {
    return (
      <div className="loading-section">
        <div className="spinner" />
        <p>Generating AI narratives for race moments...</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {/* Filter */}
      <div className="filter-bar">
        <span className="filter-label">Filter:</span>
        {["all", "pit_stop", "overtake"].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" && "All Moments"}
            {f === "pit_stop" && "🔧 Pit Stops"}
            {f === "overtake" && "⚔️ Overtakes"}
          </button>
        ))}
        <span className="moment-count">{filtered.length} moments</span>
      </div>

      {/* Timeline */}
      <div className="moment-list">
        {filtered.map((moment, i) => (
          <div
            key={i}
            className={`moment-card ${moment.type} ${
              expanded === i ? "expanded" : ""
            }`}
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div className="moment-header">
              <div className="moment-left">
                <span className="moment-lap">LAP {moment.lap}</span>
                <span className="moment-type-badge">
                  {moment.type === "pit_stop" ? "🔧 PIT STOP" : "⚔️ OVERTAKE"}
                </span>
                <span className="moment-driver">{moment.driver}</span>
              </div>
              <span className="expand-icon">
                {expanded === i ? "▲" : "▼"}
              </span>
            </div>

            {expanded === i && (
              <div className="moment-narrative">
                <p>{moment.narrative}</p>
                {moment.type === "pit_stop" && moment.detail && (
                  <div className="moment-stats">
                    <div className="stat">
                      <span className="stat-label">Position</span>
                      <span className="stat-value">
                        P{moment.detail.position}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Tire Age</span>
                      <span className="stat-value">
                        {moment.detail.tire_age} laps
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Compound</span>
                      <span className="stat-value">
                        {moment.detail.compound}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Gap Ahead</span>
                      <span className="stat-value">
                        {moment.detail.gap_ahead}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .timeline {}

        .filter-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-label {
          color: #666;
          font-size: 13px;
        }

        .filter-btn {
          background: #1a1a2e;
          border: 1px solid #333;
          color: #888;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .filter-btn:hover { color: white; border-color: #555; }
        .filter-btn.active {
          background: #e10600;
          border-color: #e10600;
          color: white;
          font-weight: 600;
        }

        .moment-count {
          margin-left: auto;
          color: #555;
          font-size: 13px;
        }

        .moment-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .moment-card {
          background: #1a1a2e;
          border: 1px solid #222;
          border-left: 4px solid #333;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .moment-card:hover { background: #22223a; }
        .moment-card.pit_stop { border-left-color: #f59e0b; }
        .moment-card.overtake { border-left-color: #3b82f6; }
        .moment-card.expanded { background: #22223a; }

        .moment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .moment-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .moment-lap {
          font-size: 12px;
          font-weight: 700;
          color: #e10600;
          background: #2d0a0a;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .moment-type-badge {
          font-size: 12px;
          font-weight: 600;
          color: #888;
        }

        .moment-driver {
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        .expand-icon {
          color: #555;
          font-size: 12px;
        }

        .moment-narrative {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #2a2a3a;
        }

        .moment-narrative p {
          color: #ccc;
          line-height: 1.7;
          font-size: 15px;
        }

        .moment-stats {
          display: flex;
          gap: 16px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .stat {
          background: #0d0d1a;
          border-radius: 6px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label {
          font-size: 10px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-value {
          font-size: 15px;
          font-weight: 700;
          color: white;
        }

        .loading-section {
          text-align: center;
          padding: 60px;
          color: #888;
        }
      `}</style>
    </div>
  );
}