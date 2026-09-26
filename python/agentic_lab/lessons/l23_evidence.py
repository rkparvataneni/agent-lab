"""23 · Evidence that conflicts

A number that appears somewhere in the transcript is not a citation.
Two tools can disagree. A cache hit can be older than the thing it
describes. The answer has to name the observation the number came from,
and it has to refuse when those observations do not agree.

A stale cache entry is a miss. Refetch. Do not answer from it.
"""

from __future__ import annotations

SLUG = "evidence"
TITLE = "Conflicting evidence"
FILE = "l23_evidence.py"


def verdict(observations: list[dict]) -> str:
    rains = {obs["rain_pct"] for obs in observations}
    if len(rains) > 1:
        return "conflict"
    return "answer"


def cache_lookup(entry: dict | None, now: int, ttl: int) -> str | None:
    if entry is None:
        return None
    if now - entry["at"] > ttl:
        return None
    return entry["value"]


def citation_points_at(cite_id: str, number: str, observations: dict[str, str]) -> bool:
    return number in observations.get(cite_id, "")


def run() -> dict:
    observations = {
        "weather": "Saturday showers, 70% chance of rain.",
        "search": "Weekend looks clear, 0% chance of rain.",
    }
    rows = [
        {"id": "weather", "rain_pct": 70},
        {"id": "search", "rain_pct": 0},
    ]
    fresh = {"at": 0, "value": "70%"}
    return {
        "conflict": verdict(rows) == "conflict",
        "agreement_answers": verdict([{"id": "weather", "rain_pct": 70}]) == "answer",
        "stale_is_a_miss": cache_lookup(fresh, now=7200, ttl=900) is None,
        "fresh_hits": cache_lookup(fresh, now=100, ttl=900) == "70%",
        "wrong_citation": citation_points_at("search", "70%", observations) is False,
        "right_citation": citation_points_at("weather", "70%", observations) is True,
    }
