"""The same six tools as the TypeScript studio, as LangChain tools.

The model never executes these. It only proposes a name and arguments.
Your graph's ToolNode (or create_agent) runs the function and writes a ToolMessage.
"""

from __future__ import annotations

from langchain.tools import tool


@tool
def weather(city: str, when: str = "weekend") -> str:
    """Forecast for a city and date range. Use this instead of guessing climate."""
    if city.lower() == "tokyo" and when == "weekend":
        return (
            "Saturday: showers, 18°C, 70% chance of rain. "
            "Sunday: clearing, 21°C, 10% chance of rain."
        )
    return f"No forecast stored for {city} ({when})."


@tool
def calculator(expression: str) -> str:
    """Evaluate a simple arithmetic expression. Use this instead of mental math."""
    allowed = set("0123456789.+-*/() ")
    if not expression or not set(expression) <= allowed:
        return "Rejected: only digits and + - * / ( ) are allowed."
    try:
        value = eval(expression, {"__builtins__": {}}, {})  # noqa: S307
        if isinstance(value, float):
            value = round(value, 2)
        return str(value)
    except Exception as exc:  # noqa: BLE001
        return f"Calculator error: {exc}"


@tool
def search(query: str) -> str:
    """Look up hours, facts, or pages from a tiny local index."""
    q = query.lower()
    if "katsu" in q:
        return "Katsu House · open 11:30–22:00. Local time 20:10."
    return f"No indexed result for {query!r}."


@tool
def calendar(when: str) -> str:
    """Check whether the user's calendar is free at a given time."""
    if "14:00" in when or "2pm" in when.lower():
        return "Free. No conflicts between 13:30 and 15:30."
    return f"{when}: no calendar data."


@tool
def rooms(seats: int = 4, whiteboard: bool = True, when: str = "tomorrow 14:00", room: str = "") -> str:
    """List or reserve meeting rooms. Pass room=west|east to reserve."""
    if room == "west":
        return "Reserved · West room · capacity 8 · whiteboard · 14:00–15:00."
    if room == "east":
        return "Reserved · East room · capacity 6 · whiteboard · 14:00–15:00."
    if seats <= 4 and whiteboard:
        return (
            "East room · seats 6 · whiteboard · free at 14:00.\n"
            "West room · seats 8 · whiteboard · free at 14:00."
        )
    return "No matching rooms."


@tool
def notes(fact: str) -> str:
    """Write a lasting fact the next run can recall."""
    return f"Noted: {fact}"


STUDIO_TOOLS = [weather, calculator, search, calendar, rooms, notes]
