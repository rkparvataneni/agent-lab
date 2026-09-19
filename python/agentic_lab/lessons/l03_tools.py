"""03 · Tools

A tool is a Python function plus a JSON schema the model can read.
@tool from LangChain builds that schema from the type hints and docstring.

The model emits: { name, args, id }.
Your runtime looks up the function, runs it, and writes a ToolMessage
with the same id. That pairing is how the next model call sees the result.
"""

from __future__ import annotations

from agentic_lab.tools import calculator, search, weather

SLUG = "tools"
TITLE = "Tools"
FILE = "l03_tools.py"


def run() -> dict:
    schemas = [t.get_input_jsonschema() for t in (weather, calculator, search)]
    forecast = weather.invoke({"city": "Tokyo", "when": "weekend"})
    tip = calculator.invoke({"expression": "86 * 0.17"})
    hours = search.invoke({"query": "Katsu House hours"})
    rejected = calculator.invoke({"expression": "__import__('os').system('id')"})
    return {
        "names": [t.name for t in (weather, calculator, search)],
        "schemas": schemas,
        "forecast": forecast,
        "tip": tip,
        "hours": hours,
        "rejected": rejected,
    }


if __name__ == "__main__":
    out = run()
    print("tools:", out["names"])
    print("forecast:", out["forecast"])
    print("tip:", out["tip"])
    print("hours:", out["hours"])
    print("rejected:", out["rejected"])
