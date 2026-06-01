import { useState, useEffect, useRef } from "react";
import axios from "axios";
import RaceSummary from "./components/RaceSummary";
import MomentTimeline from "./components/MomentTimeline";
import MomentumWall from "./components/MomentumWall";
import DriverStory from "./components/DriverStory";
import "./App.css";

const API = "http://localhost:8000";


const RACES = [
  { year: 2023, name: "Monza", label: "Monza", sublabel: "2023 Italian GP" },
  { year: 2023, name: "Silverstone", label: "Silverstone", sublabel: "2023 British GP" },
  { year: 2023, name: "Monaco", label: "Monaco", sublabel: "2023 Monaco GP" },
  { year: 2022, name: "Monza", label: "Monza", sublabel: "2022 Italian GP" },
  { year: 2022, name: "Silverstone", label: "Silverstone", sublabel: "2022 British GP" },
  { year: 2022, name: "Monaco", label: "Monaco", sublabel: "2022 Monaco GP" },
  { year: 2021, name: "Monza", label: "Monza", sublabel: "2021 Italian GP" },
  { year: 2021, name: "Monaco", label: "Monaco", sublabel: "2021 Monaco GP" },
];

function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    let mx = 0, my = 0;

    const move = (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = mx + "px";
      cursor.style.top = my + "px";
    };

    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, []);

  return (
    <div className="crosshair" ref={cursorRef}>
      <div className="ch-h" />
      <div className="ch-v" />
      <div className="ch-dot" />
    </div>
  );
}

function HeroCar() {
  return (
    <div className="hero-car-img-wrap">
      <img
        src="/f1car.png"
        alt="RaceRoom formula race car"
        className="hero-car-img"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <div className="hero-car-glow" />
    </div>
  );
}

function AboutPage() {
  return (
    <div className="about-page fade-in">
      <div className="about-hero">
        <div className="about-eyebrow">About RaceRoom</div>
        <h2>The engineer's world,<br /><span>open to everyone.</span></h2>
        <p>Formula 1 is the most data-intensive sport on the planet. Every pit stop, every overtake, every strategic call is the result of thousands of data points processed in milliseconds. RaceRoom tears down the wall between the pit wall and the grandstand.</p>
      </div>
      <div className="about-divider"/>
      <div className="about-grid">
        {[
          ["01","Strategy Narrator","Every pit stop explained — what triggered the call, what the tire data showed, what the risk was. Powered by IBM Granite AI."],
          ["02","Momentum Wall","Racing is as much psychology as physics. Tracks lap-time variance to reveal which drivers are gaining confidence lap by lap."],
          ["03","Driver Stories","Complete race narrative for every driver — lap time evolution, pit stop strategy, best and average pace."],
          ["04","Regulation Context","IBM Docling parses FIA sporting regulations and surfaces relevant rules inside every strategic explanation."],
        ].map(([n,h,p]) => (
          <div className="about-card" key={n}>
            <div className="about-card-number">{n}</div>
            <h3>{h}</h3>
            <p>{p}</p>
          </div>
        ))}
      </div>
      <div className="about-tech">
        <h3>Built With</h3>
        <div className="tech-stack">
          {["IBM Granite 4","IBM Docling","watsonx.ai","FastF1","FastAPI","React","Python","Recharts"].map(t => (
            <span key={t} className={`tech-pill ${t.startsWith("IBM") || t === "watsonx.ai" ? "ibm" : ""}`}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("race");
  const [activeTab, setActiveTab] = useState("moments");
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(2023);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [error, setError] = useState(null);
  const loadRace = async (race) => {
    setLoading(true); setError(null); setSummary(null);
    setSelectedDriver(null); setPage("race");
    try {
      const res = await axios.get(`${API}/race/${race.year}/${race.name}/summary`);
      setSummary(res.data); setSelectedRace(race); setActiveTab("moments");
    } catch { setError("Failed to load race data. Is the backend running?"); }
    setLoading(false);
  };

  return (
    <>
      <CustomCursor />
      <div className="app">

        {/* TOP RED BANNER */}
        <div className="top-banner">
          <div className="top-banner-inner">
            <div className="tb-left">
              <div className="tb-logo">
                <div className="tb-logo-flag">
                  {[[1,0,1,0],[0,1,0,1]].map((row,i) => (
                    <div className="flag-row" key={i}>
                      {row.map((c,j) => <div key={j} className="flag-cell" style={{background: c?"#fff":"rgba(0,0,0,0.4)"}}/>)}
                    </div>
                  ))}
                </div>
                <span className="tb-logo-text">RACEROOM GROUP</span>
              </div>
            </div>
            <nav className="tb-nav">
              {["STRATEGY NARRATOR","MOMENTUM WALL","DRIVER STORIES","ABOUT"].map(item => (
                <button key={item} className="tb-nav-item"
                  onClick={() => item === "ABOUT" ? setPage("about") : setPage("race")}>
                  {item}
                </button>
              ))}
            </nav>
            <div className="tb-right">
              <div className="tb-ibm-badge">IBM <span>TV</span></div>
            </div>
          </div>
        </div>

        {/* BLACK SUB-NAV */}
        <div className="sub-nav">
          <div className="sub-nav-inner">
            <div className="sn-left">
              {[2023, 2022, 2021].map((year) => (
                <button
                  key={year}
                  className={`sn-series ${selectedSeason === year ? "active" : ""}`}
                  onClick={() => {
                    setSelectedSeason(year);
                    setSummary(null);
                    setSelectedRace(null);
                    setPage("race");
                  }}>
                  {year} SEASON
                </button>
              ))}
            </div>
            <div className="sn-right">
              {[
                {key:"moments", label:"RACE MOMENTS"},
                {key:"momentum", label:"MOMENTUM WALL"},
                {key:"driver", label:"DRIVER STORIES"},
                {key:"about", label:"ABOUT"},
              ].map(({key, label}) => (
                <button key={key}
                  className={`sn-tab ${activeTab===key && page==="race" ? "active":""} ${page==="about" && key==="about" ? "active":""}`}
                  onClick={() => {
                    if(key==="about"){setPage("about")}
                    else{setPage("race"); setActiveTab(key);}
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* HERO — NO RACE LOADED */}
        {page === "race" && !summary && !loading && (
          <div className="hero">
            <div className="hero-left">
              <div className="hero-eyebrow">IBM SKILLSBUILD CHALLENGE 2026</div>
              <h1 className="hero-title">EVERY DECISION.<br/>EXPLAINED.</h1>
              <p className="hero-sub">Select a race above to see every pit stop, overtake, and strategy call explained by AI — the way an engineer sees it.</p>
              <div className="hero-actions">
                <button className="hero-btn primary" onClick={() => setActiveTab("moments")}>STRATEGY NARRATOR</button>
                <button className="hero-btn secondary" onClick={() => setActiveTab("momentum")}>MOMENTUM WALL</button>
              </div>
              <div className="hero-race-select">
                {RACES.filter(r => r.year === selectedSeason).map(race => (
                  <button key={`${race.year}-${race.name}`} className="hero-race-btn" onClick={() => loadRace(race)}>
                    <span className="hrb-year">{race.sublabel}</span>
                    <span className="hrb-name">{race.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="hero-center">
              <HeroCar />
            </div>
            <div className="hero-right">
              <div className="hero-stats-badge">
                <div className="hsb-logo">IBM SKILLSBUILD</div>
                <div className="hsb-event">SELECT A RACE</div>
                <div className="hsb-sub">Choose from the races below to begin your intelligence session</div>
                <div className="hsb-divider"/>
                <div className="hsb-features">
                  {[
                    ["🎯","Strategy Narrator","AI-powered pit stop explanations"],
                    ["⚡","Momentum Wall","Psychological momentum tracking"],
                    ["🏁","Driver Stories","Complete race narratives"],
                  ].map(([icon,title,desc]) => (
                    <div className="hsb-feature" key={title}>
                      <span className="hsb-icon">{icon}</span>
                      <div>
                        <div className="hsb-feat-title">{title}</div>
                        <div className="hsb-feat-desc">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HERO — RACE LOADED */}
        {page === "race" && summary && !loading && (
          <div className="hero">
            <div className="hero-left">
              <div className="hero-eyebrow">IBM SKILLSBUILD CHALLENGE 2026</div>
              <h1 className="hero-title">EVERY DECISION.<br/>EXPLAINED.</h1>
              <p className="hero-sub">Real-time AI intelligence for every moment of the race.</p>
              <div className="hero-actions">
                <button className="hero-btn primary" onClick={() => setActiveTab("moments")}>RACE MOMENTS</button>
                <button className="hero-btn secondary" onClick={() => setActiveTab("momentum")}>MOMENTUM WALL</button>
              </div>
              <div className="hero-race-select">
                {RACES.filter(r => r.year === selectedSeason).map(race => (
                  <button key={`${race.year}-${race.name}`}
                    className={`hero-race-btn ${selectedRace?.name===race.name&&selectedRace?.year===race.year?"active":""}`}
                    onClick={() => loadRace(race)}>
                    <span className="hrb-year">{race.sublabel}</span>
                    <span className="hrb-name">{race.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="hero-center">
              <HeroCar />
            </div>
            <div className="hero-right">
              <div className="hero-stats-badge">
                <div className="hsb-logo">IBM SKILLSBUILD</div>
                <div className="hsb-event">{summary.year} {summary.event} GP</div>
                <div className="hsb-sub">{summary.weather} · {summary.total_drivers} drivers</div>
                <div className="hsb-divider"/>
                {summary.drivers.slice(0,5).map((d) => (
                  <div className="hsb-driver" key={d.code}
                    onClick={() => { setActiveTab("driver"); setSelectedDriver(d.code); }}>
                    <span className="hsd-pos">P{d.final_position}</span>
                    <span className="hsd-code">{d.code}</span>
                    <span className="hsd-name">{d.name}</span>
                    <span className="hsd-team">{d.team}</span>
                  </div>
                ))}
                <div className="hsb-divider"/>
                <div className="hsb-more">+{summary.total_drivers - 5} more drivers →</div>
              </div>
            </div>
          </div>
        )}

        {/* HERO — LOADING */}
        {loading && (
          <div className="hero hero-loading">
            <div className="hero-left">
              <div className="hero-eyebrow">LOADING RACE DATA</div>
              <h1 className="hero-title">ANALYSING<br/>TELEMETRY.</h1>
              <div className="loading-track"><span className="loading-car">🏎️</span></div>
              <p className="hero-sub">Generating AI narratives — first load may take 30–60 seconds</p>
            </div>
            <div className="hero-center"><HeroCar /></div>
            <div className="hero-right"/>
          </div>
        )}

        {/* MAIN CONTENT */}
        <main className="main">
          {error && <div className="error">{error}</div>}
          {page === "about" && <AboutPage/>}
          {page === "race" && summary && !loading && (
            <div className="fade-in">
              <div className="section-header">
                <span className="section-label">Race Classification</span>
                <span className="section-meta">{summary.year} {summary.event} Grand Prix</span>
              </div>
              <RaceSummary
                summary={summary}
                onDriverClick={(code) => { setSelectedDriver(code); setActiveTab("driver"); }}
              />
              <div className="content-tabs">
                {[
                  {key:"moments",label:"RACE MOMENTS"},
                  {key:"momentum",label:"MOMENTUM WALL"},
                  {key:"driver",label:"DRIVER STORY"},
                ].map(({key,label}) => (
                  <button key={key} className={`content-tab ${activeTab===key?"active":""}`}
                    onClick={() => setActiveTab(key)}>{label}</button>
                ))}
              </div>
              <div className="content-area">
                {activeTab==="moments" && <MomentTimeline race={selectedRace} api={API}/>}
                {activeTab==="momentum" && <MomentumWall race={selectedRace} api={API}/>}
                {activeTab==="driver" && <DriverStory race={selectedRace} api={API} drivers={summary.drivers} initialDriver={selectedDriver}/>}
              </div>
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-event">
              <div className="fe-label">NEXT SESSION</div>
              <div className="fe-name">Austrian GP · July 2–4, 2026</div>
              <div className="fe-circuit">Red Bull Ring · Spielberg, Austria</div>
            </div>
            <div className="footer-tech">
              {["IBM","WATSONX.AI","GRANITE 4","FASTF1","FASTAPI","REACT","PYTHON"].map(t => (
                <div key={t} className="ft-logo">{t}</div>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}