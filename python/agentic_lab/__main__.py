from __future__ import annotations

import argparse
import json
from typing import Any

from agentic_lab.lessons import LESSONS


def _public(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if isinstance(value, dict):
        return {k: _public(v) for k, v in value.items() if k != "messages"}
    if isinstance(value, list):
        return [_public(v) for v in value]
    if hasattr(value, "content"):
        return getattr(value, "content")
    return value


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Agentic Lab expert LangGraph lessons.")
    parser.add_argument(
        "lesson",
        nargs="?",
        default="list",
        help="lesson number (01-20), slug, 'list', or 'all'",
    )
    args = parser.parse_args()
    token = str(args.lesson).lower()

    if token in {"list", "ls"}:
        for index, lesson in enumerate(LESSONS, start=1):
            print(f"{index:02d}  {lesson.SLUG:18}  {lesson.TITLE}")
        return

    selected = LESSONS if token == "all" else [
        lesson
        for index, lesson in enumerate(LESSONS, start=1)
        if token in {f"{index:02d}", str(index), lesson.SLUG}
    ]
    if not selected:
        raise SystemExit(f"Unknown lesson: {args.lesson}")

    for lesson in selected:
        print(f"\n== {lesson.TITLE} ({lesson.FILE}) ==")
        print(json.dumps(_public(lesson.run()), indent=2, default=str))


if __name__ == "__main__":
    main()
