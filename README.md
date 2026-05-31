# 🏎️ RaceRoom - Inside the Engineer's World


---

## What is RaceRoom?

RaceRoom is a real-time AI race intelligence companion that translates every pit stop, overtake, and strategic decision into a compelling human story — giving fans genuine access to the intelligence that wins championships.

Formula 1 generates over 1 million data points per second. Every strategic call is the result of calculations made in milliseconds by race engineers. Yet fans watching at home see none of this intelligence — just raw results without context.

**RaceRoom tears down the wall between the pit wall and the grandstand.**

---

## The Problem It Solves

It bridges the gap between engineers who have all the data and fans who want to understand what they're watching. RaceRoom explains not just *what* happened — but *why* the engineer made the call, what the risk was, and what they were trying to achieve.

---

## Why It Matters

500 million F1 fans worldwide watch races without understanding the strategic chess match happening in real time. RaceRoom makes the engineer's world accessible to everyone — not as a simplified dashboard, but as a living narrative grounded in real telemetry and official regulations.

> *"The pit wall sees the data. RaceRoom explains it."*

---

## IBM Tools Used

| Tool | How |
|------|-----|
| **IBM Granite 4** (`granite-4-h-small`) | Generates all AI narratives — pit stop explanations, overtake analysis, psychological momentum analysis via watsonx.ai |
| **IBM Docling** | Parses the FIA 2024 Sporting Regulations PDF into searchable chunks, surfacing relevant regulation context inside every strategic explanation |
| **watsonx.ai** | Hosts Granite and provides the inference API endpoint |

---

## Features

**Strategy Narrator** — Every pit stop explained by AI. What triggered the call, what the tire data showed, what the risk was — grounded in FIA regulations via Docling.

**Momentum Wall** — Tracks lap-time variance and trend patterns to reveal which drivers were gaining confidence and which were under pressure, lap by lap.

**Driver Stories** — Complete race narrative for every driver. Lap time evolution, pit stop strategy, best lap, average pace.

**Regulation Context** — IBM Docling parses official FIA Sporting Regulations and surfaces relevant articles inside every strategic explanation.

---

## Tech Stack

- **IBM Granite 4** — AI narrative generation
- **IBM Docling** — FIA regulation PDF parsing
- **watsonx.ai** — Model inference
- **FastF1** — Official F1 timing and telemetry data
- **FastAPI** — Backend REST API
- **React** — Frontend
- **Python** — Data processing and AI orchestration
- **Recharts** — Data visualization

---

## Getting Started

### Backend
```bash
cd backend
pip install fastapi uvicorn fastf1 requests python-dotenv docling pypdf
```

Create `backend/.env`:
```
IBM_API_KEY=your_ibm_api_key
PROJECT_ID=your_watsonx_project_id
```

```bash
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /race/{year}/{race}/summary` | Race overview and driver classification |
| `GET /race/{year}/{race}/moments` | Key moments with AI narratives |
| `GET /race/{year}/{race}/momentum` | Psychological momentum analysis |
| `GET /race/{year}/{race}/driver/{code}` | Full driver race story |
| `GET /regulations/test` | Verify Docling is working |

---