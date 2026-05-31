import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

export default function DriverStory({ race, api, drivers, initialDriver }) {
  const [selectedDriver, setSelectedDriver] = useState(
    initialDriver || (drivers[0]?.code ?? null)
  );
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDriver) setSelectedDriver(initialDriver);
  }, [initialDriver]);

  useEffect(() => {
    if (!selectedDriver || !race) return;
    setLoading(true);
    setStory(null);
    axios
      .get(`${api}/race/${race.year}/${race.name}/driver/${selectedDriver}`)
      .then((res) => {
        setStory(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDriver, race, api]);

  // Chart data — lap times over race
  const chartData = story?.laps
    .filter((l) => l.time && l.is_accurate && !l.pit_out)
    .map((l) => ({
      lap: l.lap,
      time: parseFloat(l.time.toFixed(3)),
      pit: l.is_pit_lap,
      compound: l.compound,
    })) ?? [];

  const pitLaps = story?.laps
    .filter((l) => l.is_pit_lap)
    .map((l) => l.lap) ?? [];

  return (
    <div className="driver-story">
      {/* Driver Selector */}
      <div className="driver-selector">
        {drivers.map((d) => (
          <button
            key={d.code}
            className={`ds-btn ${selectedDriver === d.code ? "active" : ""}`}
            onClick={() => setSelectedDriver(d.code)}
          >
            <span className="ds-pos">P{d.final_position}</span>
            <span className="ds-code">{d.code}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading-section">
          <div className="spinner" />
          <p>Loading {selectedDriver}'s race story...</p>
        </div>
      )}

      {story && !loading && (
        <div className="story-content">
          {/* Lap Time Chart */}
          <div className="chart-card">
            <h3>Lap Time Evolution</h3>
            <p className="chart-sub">
              Red lines mark pit stops. Faster laps = lower on chart.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="lap"
                  tick={{ fill: "#555", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Lap",
                    position: "insideBottom",
                    fill: "#555",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  tick={{ fill: "#555", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `${v}s`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0d0d1a",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(v) => [`${v}s`, "Lap Time"]}
                  labelFormatter={(l) => `Lap ${l}`}
                />
                {pitLaps.map((lap) => (
                  <ReferenceLine
                    key={lap}
                    x={lap}
                    stroke="#e10600"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pit Stop Narratives */}
          {story.pit_stops.length > 0 && (
            <div className="pit-section">
              <h3>Pit Stop Strategy</h3>
              <div className="pit-list">
                {story.pit_stops.map((stop, i) => (
                  <div key={i} className="pit-card">
                    <div className="pit-header">
                      <div className="pit-lap">LAP {stop.lap}</div>
                      <div className="pit-meta">
                        <span className={`compound-badge ${stop.compound?.toLowerCase()}`}>
                          {stop.compound}
                        </span>
                        <span className="tire-age">
                          {stop.tire_age} laps on tires
                        </span>
                        {stop.position && (
                          <span className="pit-position">P{stop.position}</span>
                        )}
                      </div>
                    </div>
                    <p className="pit-narrative">{stop.narrative}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Race Stats */}
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-box-label">Total Laps</span>
              <span className="stat-box-value">{story.total_laps}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Pit Stops</span>
              <span className="stat-box-value">{story.pit_stops.length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Best Lap</span>
              <span className="stat-box-value">
                {Math.min(...chartData.map((d) => d.time)).toFixed(3)}s
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-box-label">Avg Lap</span>
              <span className="stat-box-value">
                {(
                  chartData.reduce((a, b) => a + b.time, 0) / chartData.length
                ).toFixed(3)}s
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .driver-story {}

        .driver-selector {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .ds-btn {
          background: #1a1a2e;
          border: 1px solid #333;
          color: #888;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          gap: 6px;
          align-items: center;
          transition: all 0.2s;
        }

        .ds-btn:hover { color: white; border-color: #555; }

        .ds-btn.active {
          background: #e10600;
          border-color: #e10600;
          color: white;
        }

        .ds-pos { font-size: 11px; opacity: 0.7; }
        .ds-code { font-weight: 700; }

        .story-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .chart-card {
          background: #1a1a2e;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 24px;
        }

        .chart-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }

        .chart-sub {
          font-size: 12px;
          color: #555;
          margin-bottom: 16px;
        }

        .pit-section h3 {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
        }

        .pit-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pit-card {
          background: #1a1a2e;
          border: 1px solid #222;
          border-left: 4px solid #f59e0b;
          border-radius: 8px;
          padding: 16px;
        }

        .pit-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .pit-lap {
          font-size: 13px;
          font-weight: 700;
          color: #e10600;
          background: #2d0a0a;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .pit-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .compound-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .compound-badge.soft { background: #7f1d1d; color: #fca5a5; }
        .compound-badge.medium { background: #78350f; color: #fcd34d; }
        .compound-badge.hard { background: #1f2937; color: #d1d5db; }
        .compound-badge.inter { background: #14532d; color: #86efac; }
        .compound-badge.wet { background: #1e3a5f; color: #93c5fd; }

        .tire-age { font-size: 12px; color: #666; }
        .pit-position { font-size: 13px; font-weight: 700; color: #888; }

        .pit-narrative {
          font-size: 14px;
          color: #aaa;
          line-height: 1.7;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .stat-box {
          background: #1a1a2e;
          border: 1px solid #222;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-box-label {
          font-size: 11px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-box-value {
          font-size: 24px;
          font-weight: 800;
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