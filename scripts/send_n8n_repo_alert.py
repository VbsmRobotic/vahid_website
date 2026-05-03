#!/usr/bin/env python3
"""POST JSON to an n8n webhook from GitHub Actions (secret N8N_REPO_ALERT_WEBHOOK_URL).

Payload examples for building n8n workflows:

- pages_deploy_finished (when "Deploy GitHub Pages" completes with conclusion != success):
  {"event":"pages_deploy_finished","success":false,"conclusion":"failure",
   "repository":"owner/repo","workflow_name":"Deploy GitHub Pages","workflow_run_url":"..."}

- pull_request (opened or reopened against main):
  {"event":"pull_request","action":"opened","repository":"owner/repo","title":"...",
   "url":"https://github.com/.../pull/N","author":"login","base":"main","head":"branch"}
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request


def main() -> int:
    url = (os.environ.get("N8N_REPO_ALERT_WEBHOOK_URL") or "").strip()
    if not url:
        print("N8N_REPO_ALERT_WEBHOOK_URL unset; skipping n8n alert.")
        return 0

    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        print("Missing GITHUB_EVENT_PATH", file=sys.stderr)
        return 1

    with open(event_path, encoding="utf-8") as f:
        ev = json.load(f)

    payload: dict | None = None

    if "workflow_run" in ev:
        wr = ev.get("workflow_run") or {}
        if wr.get("name") != "Deploy GitHub Pages":
            return 0
        if wr.get("conclusion") == "success":
            return 0
        payload = {
            "event": "pages_deploy_finished",
            "success": False,
            "conclusion": wr.get("conclusion"),
            "repository": (ev.get("repository") or {}).get("full_name"),
            "workflow_name": wr.get("name"),
            "workflow_run_url": wr.get("html_url"),
        }
    elif "pull_request" in ev:
        action = ev.get("action")
        if action not in ("opened", "reopened"):
            return 0
        pr = ev.get("pull_request") or {}
        payload = {
            "event": "pull_request",
            "action": action,
            "repository": (ev.get("repository") or {}).get("full_name"),
            "title": pr.get("title"),
            "url": pr.get("html_url"),
            "author": (pr.get("user") or {}).get("login"),
            "base": (pr.get("base") or {}).get("ref"),
            "head": (pr.get("head") or {}).get("ref"),
        }
    else:
        return 0

    if not payload:
        return 0

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print("n8n alert sent, status", resp.status)
    except urllib.error.HTTPError as e:
        print("n8n webhook HTTP error:", e.code, e.read().decode("utf-8", errors="replace"), file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print("n8n webhook URL error:", e.reason, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
