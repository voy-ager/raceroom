import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from "recharts";

export default function MomentumWall({ race, api }) {
  const [momentum, setMomentum] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!race) return;
    setLoading(true);
    axios
      .get(`${api}/race/${race.year}/${race.name}/momentum`)
      .then((res) => {
        setMomentum(res.data.momentum);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [race, api]);

  if (loading) {
    return (
      <div className="loading-section">
        <div className="spinner" />
        <p>Analyzing driver momentum...</p>
      </div>
    );
  }

  return (
    <div className="momentum-wall">
      <p className="section-desc">
        Psychological momentum analysis — which drivers were gaining
        confidence and which were under pressure during the race.
      </p>

      <div className="momentum-grid">
        {momentum.map((driver, i) => {
          const chartData = driver.recent_laps.map((l) => ({
            lap: `L${l.lap}`,
            time: l.time ? parseFloat(l.time.toFixed(3)) : null,
          }));

          const isImproving = driver.trend === "improving";

          return (
            <div key={driver.driver} className="momentum-card">
              {/* Card Header */}
              <div className="momentum-header">
                <div className="momentum-rank">#{i + 1}</div>
                <div className="momentum-driver-info">
                  <span className="momentum-code">{driver.driver}</span>
                  <span className="momentum-name">{driver.name}</span>
                  <span className="momentum-team">{driver.team}</span>
                </div>
                <div className="momentum-score-block">
                  <div
                    className="momentum-score"
                    style={{
                      color: driver.momentum_score > 60
                        ? "#22c55e"
                        : driver.momentum_score > 40
                        ? "#f59e0b"
                        : "#ef4444",
                    }}
                  >
                    {driver.momentum_score}
                  </div>
                  <div className="momentum-score-label">momentum</div>
                </div>
              </div>

              {/* Trend Badge */}
              <div
                className={`trend-badge ${
                  isImproving ? "improving" : "pressure"
                }`}
              >
                {isImproving ? "📈 Gaining Momentum" : "📉 Under Pressure"}
              </div>

              {/* Lap Time Chart */}
              {chartData.length > 0 && (
                <div className="momentum-chart">
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={chartData}>
                      <XAxis
                        dataKey="lap"
                        tick={{ fill: "#555", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{
                          background: "#0d0d1a",
                          border: "1px solid #333",
                          borderRadius: "6px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        formatter={(v) => [`${v}s`, "Lap Time"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="time"
                        stroke={isImproving ? "#22c55e" : "#ef4444"}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* AI Narrative */}
              <p className="momentum-narrative">{driver.narrative}</p>
            </div>
          );
        })}
      </div>

      <style>{`
        .momentum-wall {}

        .section-desc {
          color: #666;
          font-size: 14px;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .momentum-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }

        .momentum-card {
          background: #1a1a2e;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 20px;
        }

        .momentum-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .momentum-rank {
          font-size: 13px;
          font-weight: 700;
          color: #555;
          min-width: 24px;
        }

        .momentum-driver-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .momentum-code {
          font-size: 18px;
          font-weight: 800;
          color: white;
        }

        .momentum-name {
          font-size: 12px;
          color: #666;
        }

        .momentum-team {
          font-size: 11px;
          color: #555;
        }

        .momentum-score-block {
          text-align: right;
        }

        .momentum-score {
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
        }

        .momentum-score-label {
          font-size: 10px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .trend-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .trend-badge.improving {
          background: #052e16;
          color: #22c55e;
        }

        .trend-badge.pressure {
          background: #2d0a0a;
          color: #ef4444;
        }

        .momentum-chart {
          margin: 12px 0;
          background: #0d0d1a;
          border-radius: 8px;
          padding: 8px;
        }

        .momentum-narrative {
          font-size: 13px;
          color: #888;
          line-height: 1.6;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #222;
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