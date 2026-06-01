from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from analyzer import RaceAnalyzer
import uvicorn
app = FastAPI(title="RaceRoom API", version="1.0.0")




# Allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache loaded sessions so we don't reload on every request
session_cache = {}


def get_analyzer(year: int, race: str) -> RaceAnalyzer:
    key = f"{year}_{race}"
    if key not in session_cache:
        session_cache[key] = RaceAnalyzer(year, race)
    return session_cache[key]


# ─── Routes ───────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "RaceRoom API is running 🏎️"}


@app.get("/race/{year}/{race}/summary")
def race_summary(year: int, race: str):
    """
    High level race summary — drivers, winner, weather
    First endpoint to call when loading a race
    """
    try:
        analyzer = get_analyzer(year, race)
        return analyzer.get_race_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/race/{year}/{race}/moments")
def race_moments(year: int, race: str):
    """
    All key race moments with AI narratives
    Pit stops + overtakes sorted by lap
    """
    try:
        analyzer = get_analyzer(year, race)
        return {"moments": analyzer.get_race_moments()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/race/{year}/{race}/driver/{driver_code}")
def driver_story(year: int, race: str, driver_code: str):
    """
    Full race story for one driver
    Lap timeline + pit stops with AI narratives
    """
    try:
        analyzer = get_analyzer(year, race)
        return analyzer.get_driver_story(driver_code.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/race/{year}/{race}/momentum")
def momentum_wall(year: int, race: str):
    """
    Psychological momentum analysis for top 5 drivers
    """
    try:
        analyzer = get_analyzer(year, race)
        return {"momentum": analyzer.get_momentum_wall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/race/{year}/{race}/drivers")
def all_drivers(year: int, race: str):
    """
    All drivers with final positions
    """
    try:
        analyzer = get_analyzer(year, race)
        return {"drivers": analyzer.get_all_drivers()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/regulations/test")
def test_docling():
    """Test Docling is working"""
    try:
        from docling_fia import get_relevant_regulations
        result = get_relevant_regulations("pit stop tyre compound")
        return {
            "status": "ok",
            "docling_working": bool(result),
            "sample": result[:200] if result else "No regulations found"
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)