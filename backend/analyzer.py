import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from f1_data import (
    load_race, get_lap_by_lap, get_pit_stops,
    get_overtakes, get_weather, get_momentum_data,
    get_race_key_moments
)
from granite import (
    explain_pit_stop, explain_overtake,
    generate_momentum_analysis
)


class RaceAnalyzer:
    def __init__(self, year: int, race: str):
        print(f"Loading {year} {race} Grand Prix...")
        race_data = load_race(year, race)
        self.session = race_data["session"]
        self.drivers = race_data["drivers"]
        self.event = race_data["event"]
        self.year = race_data["year"]
        self.weather = get_weather(self.session)
        print(f"Loaded {len(self.drivers)} drivers. Weather: {self.weather}")

    def get_all_drivers(self) -> list:
        result = []
        for num, info in self.drivers.items():
            laps = get_lap_by_lap(self.session, info["code"])
            if not laps:
                continue
            final_pos = None
            for lap in reversed(laps):
                if lap["position"]:
                    final_pos = lap["position"]
                    break
            result.append({
                "number": num,
                "code": info["code"],
                "name": info["name"],
                "team": info["team"],
                "final_position": final_pos,
                "total_laps": len(laps)
            })
        result.sort(key=lambda x: x["final_position"] or 99)
        return result

    def get_driver_story(self, driver_code: str) -> dict:
        laps = get_lap_by_lap(self.session, driver_code)
        pit_stops = get_pit_stops(self.session, driver_code)

        enriched_pits = []
        for stop in pit_stops:
            try:
                explained = explain_pit_stop(
                    driver=driver_code,
                    lap=stop["lap"],
                    tire_age=stop["tire_age"],
                    gap_ahead=stop["gap_ahead"],
                    gap_behind=stop["gap_behind"],
                    position=stop["position"] or 0,
                    weather=self.weather
                )
                enriched_pits.append({**stop, **explained})
            except Exception:
                enriched_pits.append({
                    **stop,
                    "narrative": f"Pit stop on lap {stop['lap']}.",
                    "type": "pit_stop"
                })

        pit_laps = {s["lap"] for s in pit_stops}
        timeline = []
        for lap in laps:
            timeline.append({
                **lap,
                "is_pit_lap": lap["lap"] in pit_laps
            })

        return {
            "driver": driver_code,
            "laps": timeline,
            "pit_stops": enriched_pits,
            "total_laps": len(laps)
        }

    def get_momentum_wall(self) -> list:
        all_drivers = self.get_all_drivers()
        top5 = [d for d in all_drivers if d["final_position"]
                and d["final_position"] <= 5]

        momentum_wall = []
        for driver in top5:
            try:
                recent = get_momentum_data(self.session, driver["code"])
                if len(recent) < 3:
                    continue
                times = [l["time"] for l in recent if l["time"]]
                if len(times) < 3:
                    continue
                avg = sum(times) / len(times)
                variance = sum((t - avg) ** 2 for t in times) / len(times)
                trend = times[-1] - times[-3]
                variance_score = max(0, 100 - (variance * 1000))
                trend_score = max(0, 100 - (trend * 50))
                momentum_score = round((variance_score + trend_score) / 2)
                analysis = generate_momentum_analysis(
                    driver=driver["name"],
                    recent_laps=recent[-8:]
                )
                momentum_wall.append({
                    "driver": driver["code"],
                    "name": driver["name"],
                    "team": driver["team"],
                    "position": driver["final_position"],
                    "momentum_score": momentum_score,
                    "trend": "improving" if trend < 0 else "under_pressure",
                    "narrative": analysis["narrative"],
                    "recent_laps": recent[-5:]
                })
            except Exception as e:
                print(f"Momentum error for {driver['code']}: {e}")
                continue

        momentum_wall.sort(key=lambda x: x["momentum_score"], reverse=True)
        return momentum_wall

    def get_race_moments(self) -> list:
        moments = get_race_key_moments(self.session)
        capped = moments[:30]
        enriched = [None] * len(capped)

        def process_moment(args):
            i, moment = args
            try:
                if moment["type"] == "pit_stop":
                    detail = moment["detail"]
                    explained = explain_pit_stop(
                        driver=moment["driver"],
                        lap=moment["lap"],
                        tire_age=detail.get("tire_age", 0),
                        gap_ahead=detail.get("gap_ahead", 2.0),
                        gap_behind=detail.get("gap_behind", 2.0),
                        position=detail.get("position") or 0,
                        weather=self.weather
                    )
                    return i, {
                        "lap": moment["lap"],
                        "type": "pit_stop",
                        "driver": moment["driver"],
                        "narrative": explained["narrative"],
                        "detail": detail
                    }
                elif moment["type"] == "overtake":
                    detail = moment["detail"]
                    explained = explain_overtake(
                        overtaking=moment["driver"],
                        overtaken=f"P{detail['position_before']}",
                        lap=moment["lap"],
                        corner=detail.get("corner", "main straight"),
                        position_gained=detail["position_after"]
                    )
                    return i, {
                        "lap": moment["lap"],
                        "type": "overtake",
                        "driver": moment["driver"],
                        "narrative": explained["narrative"],
                        "detail": detail
                    }
            except Exception as e:
                print(f"Moment error lap {moment['lap']}: {e}")
                return i, {
                    "lap": moment["lap"],
                    "type": moment["type"],
                    "driver": moment["driver"],
                    "narrative": f"{moment['type'].replace('_', ' ').title()} on lap {moment['lap']}.",
                    "detail": moment.get("detail", {})
                }

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {}
            for i, m in enumerate(capped):
                futures[executor.submit(process_moment, (i, m))] = i
                time.sleep(0.3)

            for future in as_completed(futures):
                result = future.result()
                if result:
                    i, data = result
                    enriched[i] = data

        return [m for m in enriched if m is not None]

    def get_race_summary(self) -> dict:
        all_drivers = self.get_all_drivers()
        winner = all_drivers[0] if all_drivers else None
        return {
            "event": self.event,
            "year": self.year,
            "weather": self.weather,
            "total_drivers": len(all_drivers),
            "winner": winner,
            "drivers": all_drivers
        }