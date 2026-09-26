"""26 · Tools that can hurt you

An allow-list decides which tool may run. It does not decide which
argument is safe. A fetch tool on the list can still be aimed at the
metadata address. A path the model chooses can leave the root. A secret
copied into an argument leaves with the request.

Deny those before the provider is called. The allow-list stays.
"""

from __future__ import annotations

import json
import posixpath
from urllib.parse import urlparse

SLUG = "tool-safety"
TITLE = "Unsafe tools"
FILE = "l26_tool_safety.py"


def fetch_allowed(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        return False
    host = (parsed.hostname or "").lower()
    if host in {"localhost", "metadata.google.internal"} or host.endswith(".internal"):
        return False
    if host == "169.254.169.254":
        return False
    if host.startswith("10.") or host.startswith("192.168.") or host.startswith("127."):
        return False
    return bool(host)


def path_allowed(root: str, raw: str) -> bool:
    if raw.startswith("/") or raw.startswith("~"):
        return False
    parts = posixpath.normpath(raw).split("/")
    if ".." in parts:
        return False
    full = posixpath.normpath(posixpath.join(root, raw))
    root_n = posixpath.normpath(root)
    return full == root_n or full.startswith(root_n + "/")


def args_exfiltrate(args: dict, secret: str) -> bool:
    return secret in json.dumps(args)


def run() -> dict:
    secret = "sk-live-rooms"
    return {
        "metadata_denied": fetch_allowed("http://169.254.169.254/latest/meta-data") is False,
        "localhost_denied": fetch_allowed("https://localhost/admin") is False,
        "private_net_denied": fetch_allowed("https://10.0.0.5/forecast") is False,
        "file_denied": fetch_allowed("file:///etc/passwd") is False,
        "public_https_allowed": fetch_allowed("https://api.weather.example/tokyo") is True,
        "traversal_denied": path_allowed("/notes", "../../etc/passwd") is False,
        "absolute_denied": path_allowed("/notes", "/etc/passwd") is False,
        "child_allowed": path_allowed("/notes", "tokyo/weekend.txt") is True,
        "secret_in_args": args_exfiltrate({"note": secret}, secret) is True,
        "clean_args": args_exfiltrate({"room": "West"}, secret) is False,
    }
