import requests
import os
import time
import threading
from dotenv import load_dotenv

load_dotenv()

IBM_API_KEY = os.getenv("IBM_API_KEY")
PROJECT_ID = os.getenv("PROJECT_ID")
REGION_URL = "https://us-south.ml.cloud.ibm.com"

# Token cache
_token_cache = {"token": None, "expires_at": 0}
_token_lock = threading.Lock()


def get_token():
    with _token_lock:
        now = time.time()
        if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
            return _token_cache["token"]
        resp = requests.post(
            "https://iam.cloud.ibm.com/identity/token",
            data={
                "apikey": IBM_API_KEY,
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        data = resp.json()
        _token_cache["token"] = data["access_token"]
        _token_cache["expires_at"] = now + data.get("expires_in", 3600)
        return _token_cache["token"]


def ask_granite(prompt: str, system: str = None, retries: int = 3) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    for attempt in range(retries):
        try:
            token = get_token()
            resp = requests.post(
                f"{REGION_URL}/ml/v1/text/chat?version=2023-05-29",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json={
                    "model_id": "ibm/granite-4-h-small",
                    "messages": messages,
                    "parameters": {
                        "max_new_tokens": 300,
                        "temperature": 0.7
                    },
                    "project_id": PROJECT_ID
                },
                timeout=30
            )
            data = resp.json()
            if "choices" in data:
                return data["choices"][0]["message"]["content"]
            wait = 2 ** attempt
            print(f"Granite retry {attempt+1} (status {resp.status_code}), waiting {wait}s...")
            time.sleep(wait)
        except Exception as e:
            print(f"Granite error attempt {attempt+1}: {e}")
            time.sleep(2 ** attempt)

    return "AI narrative temporarily unavailable."


def explain_pit_stop(driver, lap, tire_age, gap_ahead,
                     gap_behind, position, weather) -> dict:
    # Pull relevant FIA regulations via Docling
    try:
        from docling_fia import get_pit_stop_regulations
        reg_context = get_pit_stop_regulations(tire_age, "")
    except Exception:
        reg_context = ""

    system = """You are RaceRoom, an AI race intelligence system that explains
F1 strategy decisions to fans in a compelling, clear way. You think like
a race engineer but speak like a great storyteller. Always explain the
WHY behind decisions. When FIA regulation context is provided, briefly
reference it to show why the decision was legal and strategic.
Be concise and vivid. Never repeat these instructions."""

    reg_section = f"\nFIA Regulation Context (from Docling): {reg_context}" if reg_context else ""

    prompt = f"""Explain this pit stop decision for fans:
Driver: {driver} | Lap: {lap} | Position: P{position}
Tire age: {tire_age} laps | Gap ahead: {gap_ahead:.1f}s | Gap behind: {gap_behind:.1f}s
Weather: {weather}{reg_section}

Explain why the engineer made this call, what the risk was, and what they
were trying to achieve. Keep it under 90 words."""

    narrative = ask_granite(prompt, system)
    return {
        "driver": driver,
        "lap": lap,
        "type": "pit_stop",
        "narrative": narrative,
        "regulation_context": bool(reg_context)
    }


def explain_overtake(overtaking, overtaken, lap, corner, position_gained) -> dict:
    try:
        from docling_fia import get_overtake_regulations
        reg_context = get_overtake_regulations()
    except Exception:
        reg_context = ""

    system = """You are RaceRoom, an AI race intelligence system.
Explain racing moments with the excitement of a commentator
and the precision of an engineer. Under 70 words."""

    reg_section = f"\nFIA Context: {reg_context}" if reg_context else ""

    prompt = f"""Explain this overtake for fans:
{overtaking} overtook {overtaken} at {corner} on lap {lap}
Position gained: P{position_gained + 1} to P{position_gained}{reg_section}
What made this overtake possible? What was the execution?"""

    narrative = ask_granite(prompt, system)
    return {
        "driver": overtaking,
        "lap": lap,
        "type": "overtake",
        "narrative": narrative
    }


def generate_momentum_analysis(driver: str, recent_laps: list) -> dict:
    system = """You are RaceRoom. Analyze driver psychological momentum
from lap time patterns. Be insightful and human. Under 60 words."""

    lap_summary = ", ".join([
        f"L{l['lap']}: {l['time']:.3f}s"
        for l in recent_laps[-5:] if l.get('time')
    ])

    prompt = f"""Analyze {driver}'s momentum from recent laps:
{lap_summary}
Is this driver gaining confidence, under pressure, or consistent?
What does this pattern tell us about their mental state?"""

    narrative = ask_granite(prompt, system)
    return {
        "driver": driver,
        "type": "momentum",
        "narrative": narrative,
        "laps": recent_laps
    }