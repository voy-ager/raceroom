import fastf1
import pandas as pd
import numpy as np
from pathlib import Path

# Enable cache
cache_dir = Path.home() / ".raceroom_cache"
cache_dir.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(cache_dir))


def load_race(year: int, race: str) -> dict:
    """Load full race session and return structured data"""
    session = fastf1.get_session(year, race, 'R')
    session.load()
    
    drivers = {}
    for drv in session.drivers:
        try:
            drv_laps = session.laps.pick_drivers(drv)
            info = session.get_driver(drv)
            drivers[drv] = {
                "code": info["Abbreviation"],
                "name": f"{info['FirstName']} {info['LastName']}",
                "team": info["TeamName"],
                "number": drv
            }
        except Exception:
            continue

    return {
        "session": session,
        "drivers": drivers,
        "event": race,
        "year": year
    }


def get_lap_by_lap(session, driver_code: str) -> list:
    """Get lap-by-lap data for a driver"""
    laps = session.laps.pick_drivers(
        _get_driver_number(session, driver_code)
    )
    
    result = []
    for _, lap in laps.iterrows():
        try:
            lap_time = lap["LapTime"].total_seconds() if pd.notna(lap["LapTime"]) else None
            result.append({
                "lap": int(lap["LapNumber"]),
                "time": lap_time,
                "position": int(lap["Position"]) if pd.notna(lap["Position"]) else None,
                "stint": int(lap["Stint"]) if pd.notna(lap["Stint"]) else None,
                "compound": lap["Compound"] if pd.notna(lap["Compound"]) else "UNKNOWN",
                "tire_life": int(lap["TyreLife"]) if pd.notna(lap["TyreLife"]) else None,
                "pit_in": pd.notna(lap["PitInTime"]),
                "pit_out": pd.notna(lap["PitOutTime"]),
                "is_accurate": bool(lap["IsAccurate"])
            })
        except Exception:
            continue
    
    return result


def get_pit_stops(session, driver_code: str) -> list:
    """Extract pit stop moments with context"""
    number = _get_driver_number(session, driver_code)
    laps = session.laps.pick_drivers(number)
    
    pit_stops = []
    for _, lap in laps.iterrows():
        if pd.notna(lap["PitInTime"]):
            lap_num = int(lap["LapNumber"])
            
            # Get gaps - gap to car ahead and behind
            gap_ahead, gap_behind = _get_gaps(session, number, lap_num)
            
            pit_stops.append({
                "lap": lap_num,
                "position": int(lap["Position"]) if pd.notna(lap["Position"]) else None,
                "tire_age": int(lap["TyreLife"]) if pd.notna(lap["TyreLife"]) else 0,
                "compound": lap["Compound"] if pd.notna(lap["Compound"]) else "UNKNOWN",
                "gap_ahead": gap_ahead,
                "gap_behind": gap_behind,
            })
    
    return pit_stops


def get_overtakes(session) -> list:
    """Detect overtakes by tracking position changes"""
    overtakes = []
    all_laps = session.laps
    
    # Group by lap number and track position changes
    max_lap = int(all_laps["LapNumber"].max())
    
    for lap_num in range(2, min(max_lap + 1, 50)):
        try:
            curr_lap = all_laps[all_laps["LapNumber"] == lap_num][["Driver", "Position"]].dropna()
            prev_lap = all_laps[all_laps["LapNumber"] == lap_num - 1][["Driver", "Position"]].dropna()
            
            curr_lap = curr_lap.set_index("Driver")
            prev_lap = prev_lap.set_index("Driver")
            
            common = curr_lap.index.intersection(prev_lap.index)
            
            for driver in common:
                curr_pos = int(curr_lap.loc[driver, "Position"])
                prev_pos = int(prev_lap.loc[driver, "Position"])
                
                # Position improved by 1 = overtake
                if prev_pos - curr_pos == 1:
                    overtakes.append({
                        "lap": lap_num,
                        "driver": driver,
                        "position_before": prev_pos,
                        "position_after": curr_pos,
                        "corner": "main straight"  # FastF1 doesn't give corner detail
                    })
        except Exception:
            continue
    
    return overtakes


def get_weather(session) -> str:
    """Get simplified weather description"""
    try:
        weather = session.weather_data
        if weather is None or weather.empty:
            return "dry"
        
        latest = weather.iloc[-1]
        if latest.get("Rainfall", False):
            return "wet"
        temp = latest.get("TrackTemp", 30)
        if temp > 45:
            return "very hot track"
        elif temp > 35:
            return "warm track"
        return "dry"
    except Exception:
        return "dry"


def get_momentum_data(session, driver_code: str) -> list:
    """Get recent lap times for momentum analysis"""
    laps = get_lap_by_lap(session, driver_code)
    
    # Filter accurate laps only, no pit laps
    clean = [l for l in laps 
             if l["time"] and l["is_accurate"] 
             and not l["pit_in"] and not l["pit_out"]]
    
    return clean


def get_race_key_moments(session) -> list:
    """Get all key moments: pit stops + overtakes combined and sorted"""
    moments = []
    
    # Add overtakes
    overtakes = get_overtakes(session)
    for ov in overtakes:
        moments.append({
            "lap": ov["lap"],
            "type": "overtake",
            "driver": ov["driver"],
            "detail": ov
        })
    
    # Add pit stops for all drivers
    drivers_info = {}
    for drv in session.drivers:
        try:
            info = session.get_driver(drv)
            drivers_info[drv] = info["Abbreviation"]
        except Exception:
            continue
    
    for drv_num, drv_code in drivers_info.items():
        try:
            stops = get_pit_stops(session, drv_code)
            for stop in stops:
                moments.append({
                    "lap": stop["lap"],
                    "type": "pit_stop",
                    "driver": drv_code,
                    "detail": stop
                })
        except Exception:
            continue
    
    # Sort by lap
    moments.sort(key=lambda x: x["lap"])
    return moments


def _get_driver_number(session, driver_code: str) -> str:
    """Convert driver code (VER) to number (1)"""
    for drv in session.drivers:
        try:
            info = session.get_driver(drv)
            if info["Abbreviation"] == driver_code:
                return drv
        except Exception:
            continue
    return driver_code


def _get_gaps(session, driver_number: str, lap_num: int) -> tuple:
    """Get gap to car ahead and behind at a given lap"""
    try:
        lap_data = session.laps[session.laps["LapNumber"] == lap_num]
        lap_data = lap_data[pd.notna(lap_data["Position"])].sort_values("Position")
        
        positions = lap_data[["Driver", "Position"]].values.tolist()
        driver_pos = None
        
        for d, p in positions:
            if d == driver_number:
                driver_pos = int(p)
                break
        
        if driver_pos is None:
            return 2.0, 2.0
        
        gap_ahead = 2.0
        gap_behind = 2.0
        
        # Simplified - return position-based estimate
        if driver_pos > 1:
            gap_ahead = float(driver_pos) * 0.8
        if driver_pos < len(positions):
            gap_behind = float(len(positions) - driver_pos) * 0.5
            
        return round(gap_ahead, 1), round(gap_behind, 1)
    except Exception:
        return 2.0, 2.0