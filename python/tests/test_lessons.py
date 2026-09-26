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
    l16_clarify,
    l17_parallel,
    l18_budget_routing,
    l19_credentials,
    l20_trace,
    l21_durability,
    l22_protocol,
    l23_evidence,
    l24_judges,
    l25_memory_write,
    l26_tool_safety,
    l27_operate,
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
    assert result["keyword_eval_passes_a_guess"] is True
    assert result["trajectory_rejects_that_guess"] is True


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


def test_clarify_asks_instead_of_inventing():
    result = l16_clarify.run()
    assert result["empty_action"] == "ask"
    assert result["empty_invented"] is False
    assert result["empty_tool"] is None
    assert result["one_question"] is True
    assert result["partial_still_asks"] is True
    assert result["ready_reserves"] is True


def test_partial_failure_keeps_the_success():
    result = l17_parallel.run()
    assert result["kept_tip"] is True
    assert result["retried_only_search"] is True
    assert result["did_not_recompute"] is True
    assert result["both_ok"] is True


def test_budget_routes_and_stops():
    result = l18_budget_routing.run()
    assert result["classify_model"] == "small"
    assert result["answer_model"] == "large"
    assert result["over_budget"] == "stop"
    assert result["cache_hit"] == "Saturday showers, 70%"
    assert result["cache_miss"] is None


def test_credentials_never_enter_the_prompt():
    result = l19_credentials.run()
    assert result["leak_blocked"] is True
    assert result["scoped_called"] is True
    assert result["scoped_prompt_clean"] is True
    assert result["widen_denied"] is True


def test_trace_blames_the_failed_span():
    result = l20_trace.run()
    assert result["one_trace"] is True
    assert result["healthy_blame"] is None
    assert result["failed_span"] == "search"
    assert result["known_steps"] == "workflow"
    assert result["unknown_next_tool"] == "agent"


def test_resume_reuses_the_idempotency_key():
    result = l21_durability.run()
    assert result["resume_same_receipt"] is True
    assert result["resume_skipped_provider"] is True
    assert result["naive_second_charge"] is True
    assert result["ledger_kept_original"] is True
    assert result["compensated"] is True


def test_protocol_refuses_a_partial_call():
    result = l22_protocol.run()
    assert result["partial_not_executed"] is True
    assert result["partial_has_no_tool_message"] is True
    assert result["unknown_not_executed"] is True
    assert result["unknown_replies"] is True
    assert result["schema_not_executed"] is True
    assert result["schema_names_the_field"] is True
    assert result["valid_executed"] is True
    assert result["mismatched_id_rejected"] is True
    assert result["matching_id_accepted"] is True


def test_conflicting_evidence_is_not_a_citation():
    result = l23_evidence.run()
    assert result["conflict"] is True
    assert result["agreement_answers"] is True
    assert result["stale_is_a_miss"] is True
    assert result["fresh_hits"] is True
    assert result["wrong_citation"] is True
    assert result["right_citation"] is True


def test_fluency_judge_passes_a_guess():
    result = l24_judges.run()
    assert result["fluency_passes_guess"] is True
    assert result["keyword_passes_guess"] is True
    assert result["grounded_rejects_guess"] is True
    assert result["grounded_accepts_citation"] is True
    assert result["prose_rejected"] is True
    assert result["string_amount_rejected"] is True
    assert result["json_amount"] is True


def test_memory_write_rejects_a_summary():
    result = l25_memory_write.run()
    assert result["admits_user_field"] is True
    assert result["admits_tool_field"] is True
    assert result["rejects_transcript"] is True
    assert result["rejects_summary"] is True
    assert result["clean_next_turn"] is True
    assert result["poison_becomes_evidence"] is True


def test_unsafe_arguments_never_reach_the_provider():
    result = l26_tool_safety.run()
    assert result["metadata_denied"] is True
    assert result["localhost_denied"] is True
    assert result["private_net_denied"] is True
    assert result["file_denied"] is True
    assert result["public_https_allowed"] is True
    assert result["traversal_denied"] is True
    assert result["absolute_denied"] is True
    assert result["child_allowed"] is True
    assert result["secret_in_args"] is True
    assert result["clean_args"] is True


def test_operate_redacts_and_rolls_back():
    result = l27_operate.run()
    assert result["cost"] == 0.00065
    assert result["redacted"] is True
    assert result["secret_gone"] is True
    assert result["rolled_back"] is True
    assert result["history_keeps_the_bad_run"] is True
    assert result["blame_tool"] is True
    assert result["blame_model"] is True
    assert result["within_budget"] is True
