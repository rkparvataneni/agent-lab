from agentic_lab.lessons import (
    l01_chain_vs_graph,
    l02_state_graph,
    l03_tools,
    l04_react_graph,
    l05_create_agent,
    l06_memory,
    l07_plan_replan,
    l08_hitl,
    l09_multi_agent,
    l10_production,
    l11_hand_code,
    l12_hallucination,
    l13_controls,
    l14_rate_limits,
    l15_context_and_injection,
)


def test_chain_vs_graph_refuses_guess():
    result = l01_chain_vs_graph.run()
    assert "guess" in result["chain"].lower()
    assert "tool" in result["graph_answer"].lower()
    assert result["routed"] == "refuse"
    assert result["evidence"] == ""


def test_state_graph_routes():
    result = l02_state_graph.run()
    assert result["weather"]["kind"] == "weather"
    assert result["booking"]["kind"] == "booking"
    assert result["unclear"]["kind"] == "unclear"
    assert result["weather"]["trace"] == ["classify", "weather_desk"]


def test_tools_are_real_functions():
    result = l03_tools.run()
    assert "70%" in result["forecast"]
    assert result["tip"] == "14.62"
    assert "22:00" in result["hours"]
    assert "Rejected" in result["rejected"]
    assert result["rejected_class"] == "policy"
    assert result["retry_policy_error"] is False
    assert result["rooms_side_effect"] == "write"


def test_react_graph_calls_weather():
    result = l04_react_graph.run()
    assert result["tool_used"] is True
    assert "umbrella" in result["answer"].lower()
    assert result["loop_stopped"] is True
    assert result["loop_tool_calls"] == 1


def test_create_agent_dinner():
    result = l05_create_agent.run()
    assert result["used"] == ["calculator", "search"]
    assert "14.62" in result["answer"]
    assert result["grounded"] is True


def test_memory_grows_on_same_thread():
    result = l06_memory.run()
    assert result["same_thread_grew"] is True
    assert result["fresh_len"] < result["second_len"]
    assert result["store_has_forecast"] is True
    assert result["fresh_thread_misses_store"] is True


def test_plan_replans_on_conflict():
    result = l07_plan_replan.run()
    assert "East" in result["happy"]
    assert result["replanned"] is True
    assert "West" in result["conflict"]
    assert result["transient_retried"] is True
    assert result["denied"].startswith("No legal room")


def test_hitl_pauses_then_resumes():
    result = l08_hitl.run()
    assert result["approved"] is True
    assert "West" in result["resumed"]
    assert result["rejected_booked"] is False
    assert result["repeat_reserve"].startswith("Already reserved")


def test_supervisor_splits_toolboxes():
    result = l09_multi_agent.run()
    assert result["weather_specialist"] == "weather"
    assert result["booking_specialist"] == "booking"
    assert result["weather_allowed"] == ["weather"]
    assert result["booking_allowed"] == ["calendar", "rooms"]
    assert "umbrella" in result["weather_answer"].lower()
    assert "West" in result["booking_answer"]


def test_production_evals_pass():
    result = l10_production.run()
    assert result["passed"] is True
    assert result["tip"]["amount_usd"] == 14.62


def test_hand_coded_loop_has_tool_message():
    result = l11_hand_code.run()
    assert result["hand_coded"] is True
    assert result["framework"] is None
    assert result["roles"] == ["human", "ai", "tool", "ai"]
    assert result["tool_messages"] == 1
    assert "umbrella" in result["answer"].lower()


def test_hallucination_requires_observations():
    result = l12_hallucination.run()
    assert result["guess_grounded"] is False
    assert result["cited_grounded"] is True
    assert result["extra_claim_grounded"] is False
    assert result["fabricated"] is True
    assert result["real_tool_not_fabricated"] is False


def test_sampling_controls_are_named():
    result = l13_controls.run()
    assert "temperature" in result["parameters"]
    assert "top_p" in result["parameters"]
    assert "TPU" in result["tpu_is_hardware"] or "chip" in result["tpu_is_hardware"]
    assert result["cold"] == "tool"
    assert result["hot_seed_stable"] is True
    assert result["tight_top_p"] == "tool"
    assert result["top_k_1"] == "tool"
    assert result["truncated"] == "truncated"
    assert result["seed_changes_hot_draw"] is True


def test_rate_limits_honor_retry_after():
    result = l14_rate_limits.run()
    assert result["under_budget"] == "ok"
    assert result["rpm_full"] == "rpm"
    assert result["tpm_full"] == "tpm"
    assert result["policy_not_retried"] == "stop"
    assert result["honored"] == "backoff"
    assert result["ignored_header"] == "retry_now"
    assert result["second_429"] == "exhausted"


def test_context_trim_keeps_latest_tool_and_ignores_injection():
    result = l15_context_and_injection.run()
    assert result["kept_system"] is True
    assert result["kept_latest_tool"] is True
    assert result["dropped_old_answer"] is True
    assert result["injection_obeyed"] is False
    assert result["injection_detected"] is True
    assert result["execute_on_tool_calls"] is True
    assert result["execute_on_length"] is False
