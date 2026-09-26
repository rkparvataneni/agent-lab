"""13 · Sampling controls

These are the knobs on the model call:

    temperature, top_p, top_k, max_tokens, frequency_penalty,
    presence_penalty, seed, stop, n

temperature stretches the distribution. top_p keeps the smallest set of
tokens whose mass sums to p. top_k keeps the k likeliest tokens.
max_tokens is a hard stop: finish_reason "length" means the tool-call
JSON may be cut in half. Do not execute a partial call.
seed makes a draw reproducible. stop ends the string. n asks for more
than one completion.

A TPU is a chip. It is not a parameter. TPM (tokens per minute) is a
rate-limit budget, taught in the next lesson. top_p is the sampler.
"""

from __future__ import annotations

SLUG = "controls"
TITLE = "Sampling controls"
FILE = "l13_controls.py"

PARAMETERS = (
    "temperature",
    "top_p",
    "top_k",
    "max_tokens",
    "frequency_penalty",
    "presence_penalty",
    "seed",
    "stop",
    "n",
)

NOT_PARAMETERS = {
    "tpu": "A TPU is a chip some providers serve models on. It is not a sampler argument.",
    "tpm": "Tokens per minute. An account budget, not a sampler argument.",
    "top_p": "Nucleus sampling. This one is a sampler argument.",
}


def choose(
    *,
    temperature: float,
    top_p: float,
    top_k: int,
    max_tokens: int,
    seed: int,
) -> str:
    """Deterministic stand-in for one draw. Same seed, same label."""
    if max_tokens < 24:
        return "truncated"
    if top_k <= 1 or top_p <= 0.2:
        return "tool"
    draw = ((seed * 1103515245 + 12345) % 2**31) / 2**31
    if temperature >= 0.8 and draw < (temperature - 0.5):
        return "guess"
    return "tool"


def run() -> dict:
    cold = choose(temperature=0, top_p=1, top_k=50, max_tokens=256, seed=7)
    hot_a = choose(temperature=1.2, top_p=1, top_k=50, max_tokens=256, seed=1)
    hot_a_again = choose(temperature=1.2, top_p=1, top_k=50, max_tokens=256, seed=1)
    tight = choose(temperature=1.2, top_p=0.1, top_k=50, max_tokens=256, seed=1)
    greedy = choose(temperature=1.2, top_p=1, top_k=1, max_tokens=256, seed=1)
    short = choose(temperature=0, top_p=1, top_k=1, max_tokens=8, seed=1)
    labels = {
        choose(temperature=1.2, top_p=1, top_k=50, max_tokens=256, seed=seed)
        for seed in range(40)
    }
    return {
        "parameters": list(PARAMETERS),
        "tpu_is_hardware": NOT_PARAMETERS["tpu"],
        "tpm_is_a_budget": NOT_PARAMETERS["tpm"],
        "cold": cold,
        "hot_seed_stable": hot_a == hot_a_again,
        "tight_top_p": tight,
        "top_k_1": greedy,
        "truncated": short,
        "seed_changes_hot_draw": labels == {"tool", "guess"},
    }
