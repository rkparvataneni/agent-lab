"""A scripted chat model that speaks LangChain's tool-call protocol.

Swap this for ChatOpenAI / ChatAnthropic when you have a key.
The graph, tools, checkpointer, and interrupts stay the same.
"""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, ToolMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from pydantic import Field


def _text(message: BaseMessage) -> str:
    content = message.content
    return content if isinstance(content, str) else str(content)


def _has_tool_result(messages: list[BaseMessage], name: str) -> bool:
    return any(isinstance(m, ToolMessage) and m.name == name for m in messages)


def _last_user(messages: list[BaseMessage]) -> str:
    for message in reversed(messages):
        if message.type == "human":
            return _text(message).lower()
    return ""


class ScriptedChatModel(BaseChatModel):
    """Deterministic stand-in for an LLM. Enough to exercise a real graph."""

    mission: str = "tokyo-weekend"
    bound_tools: list[Any] = Field(default_factory=list)

    @property
    def _llm_type(self) -> str:
        return "scripted-agentic-lab"

    def bind_tools(self, tools: list[Any], **kwargs: Any) -> ScriptedChatModel:  # noqa: ARG002
        return self.model_copy(update={"bound_tools": list(tools)})

    def _call(self, name: str, args: dict[str, Any]) -> AIMessage:
        return AIMessage(
            content="",
            tool_calls=[{"name": name, "args": args, "id": f"call_{uuid4().hex[:8]}"}],
        )

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,  # noqa: ARG002
        run_manager: Any = None,  # noqa: ARG002
        **kwargs: Any,  # noqa: ARG002
    ) -> ChatResult:
        user = _last_user(messages)
        message = self._decide(user, messages)
        return ChatResult(generations=[ChatGeneration(message=message)])

    def _decide(self, user: str, messages: list[BaseMessage]) -> AIMessage:
        if "umbrella" in user or "tokyo" in user:
            kind = "tokyo-weekend"
        elif "tip" in user or "katsu" in user:
            kind = "dinner-tip"
        elif "room" in user or "whiteboard" in user:
            kind = "book-room"
        else:
            kind = self.mission

        if kind == "tokyo-weekend":
            if not _has_tool_result(messages, "weather"):
                return self._call("weather", {"city": "Tokyo", "when": "weekend"})
            return AIMessage(
                content=(
                    "Yes. Saturday in Tokyo looks like showers (about 70% chance). "
                    "Pack an umbrella. Sunday should be clearer and around 21°C."
                )
            )

        if kind == "dinner-tip":
            if not _has_tool_result(messages, "calculator"):
                return self._call("calculator", {"expression": "86 * 0.17"})
            if not _has_tool_result(messages, "search"):
                return self._call("search", {"query": "Katsu House hours today"})
            return AIMessage(
                content=(
                    "A 17% tip on $86 is $14.62. Katsu House is open until 22:00 "
                    "and it is 20:10 now, so you still have time."
                )
            )

        if kind == "book-room":
            if not _has_tool_result(messages, "calendar"):
                return self._call("calendar", {"when": "tomorrow 14:00"})
            if not _has_tool_result(messages, "rooms"):
                return self._call(
                    "rooms",
                    {"seats": 4, "whiteboard": True, "when": "tomorrow 14:00"},
                )
            return AIMessage(
                content=(
                    "Booked. East room tomorrow at 2pm, seats 6, whiteboard included. "
                    "Your calendar is clear."
                )
            )

        return AIMessage(content="I need a more specific goal, or a tool that can help.")
