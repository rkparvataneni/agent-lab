"""22 · Model output that violates the protocol

The hand-coded loop assumes a tool call with a known name, arguments that
match the schema, and an id the tool message can copy. Production traffic
is the other transcript.

finish_reason length means the JSON was sliced. Do not execute it.
An unknown name or a missing field comes back as a tool message so the
model can repair the call. A tool message whose id does not match the
assistant's tool_call_id is not a valid transcript, and it is not sent.
"""

from __future__ import annotations

SLUG = "protocol"
TITLE = "Protocol violations"
FILE = "l22_protocol.py"

SCHEMA = {"weather": ("city", "when")}


def dispatch(call: dict, finish_reason: str) -> dict:
    if finish_reason == "length":
        return {"execute": False, "reason": "partial", "tool_message": None}
    name = call.get("name")
    if name not in SCHEMA:
        return {
            "execute": False,
            "reason": "unknown",
            "tool_message": f"Unknown tool {name}. Available: weather.",
        }
    missing = [field for field in SCHEMA[name] if field not in (call.get("args") or {})]
    if missing:
        return {
            "execute": False,
            "reason": "schema",
            "tool_message": "Missing " + ", ".join(missing) + ".",
        }
    if not call.get("id"):
        return {"execute": False, "reason": "missing_id", "tool_message": None}
    return {
        "execute": True,
        "reason": "ok",
        "tool_message": None,
        "tool_call_id": call["id"],
    }


def transcript_ok(call_id: str, message_id: str) -> bool:
    return bool(call_id) and call_id == message_id


def run() -> dict:
    partial = dispatch({"name": "weather", "args": {"city": "Tok"}, "id": "call_1"}, "length")
    unknown = dispatch({"name": "search_web", "args": {}, "id": "call_2"}, "tool_calls")
    missing = dispatch({"name": "weather", "args": {"city": "Tokyo"}, "id": "call_3"}, "tool_calls")
    valid = dispatch(
        {"name": "weather", "args": {"city": "Tokyo", "when": "weekend"}, "id": "call_4"},
        "tool_calls",
    )
    return {
        "partial_not_executed": partial["execute"] is False and partial["reason"] == "partial",
        "partial_has_no_tool_message": partial["tool_message"] is None,
        "unknown_not_executed": unknown["execute"] is False and unknown["reason"] == "unknown",
        "unknown_replies": "Unknown tool" in (unknown["tool_message"] or ""),
        "schema_not_executed": missing["execute"] is False and missing["reason"] == "schema",
        "schema_names_the_field": "when" in (missing["tool_message"] or ""),
        "valid_executed": valid["execute"] is True and valid["tool_call_id"] == "call_4",
        "mismatched_id_rejected": transcript_ok("call_4", "call_9") is False,
        "matching_id_accepted": transcript_ok("call_4", "call_4") is True,
    }
