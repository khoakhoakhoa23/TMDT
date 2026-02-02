#!/usr/bin/env python3
"""
Simple automated WebSocket test script.

What it does:
 - Connects to the notifications WebSocket for a given user_id.
 - Calls the admin POST /api/notifications/send-test/ API to create+send a notification.
 - Waits for the notification to be received via WebSocket and reports success/failure.

Dependencies:
  pip install requests websocket-client

Usage:
  python scripts/ws_test.py --api http://127.0.0.1:8000/api/ --user 2 --order 123 --admin-token "<JWT_TOKEN>" --timeout 10

Notes:
 - The script expects the backend to be running (ASGI with Channels) and the API reachable.
 - admin-token is required (endpoint is admin-only). You can get a token from your auth flow.
 - The script will exit with code 0 on success (message received), non-zero on failure.
"""
import argparse
import json
import threading
import time
import sys

import requests
from websocket import WebSocketApp


def normalize_ws_base(api_base: str) -> str:
    # Remove trailing slash
    base = api_base.rstrip("/")
    # Remove trailing '/api' if present
    if base.endswith("/api"):
        base = base[: -4]
    # Replace http(s) -> ws(s)
    if base.startswith("https://"):
        return "wss://" + base[len("https://") :]
    if base.startswith("http://"):
        return "ws://" + base[len("http://") :]
    return base


def run_test(api_base, user_id, order_id, admin_token, timeout=10):
    ws_base = normalize_ws_base(api_base)
    ws_url = f"{ws_base}/ws/notifications/{user_id}/"

    received = {"flag": False, "payload": None}
    evt = threading.Event()

    def on_message(ws, message):
        try:
            data = json.loads(message)
        except Exception:
            data = message
        received["flag"] = True
        received["payload"] = data
        print("[WS] Received message:", data)
        evt.set()

    def on_error(ws, error):
        print("[WS] Error:", error)

    def on_close(ws, close_status_code, close_msg):
        print("[WS] Closed", close_status_code, close_msg)

    def on_open(ws):
        print("[WS] Connected to", ws_url)

    print("[Test] Connecting to WebSocket:", ws_url)
    ws = WebSocketApp(ws_url, on_open=on_open, on_message=on_message, on_error=on_error, on_close=on_close)

    # Run WS in background thread
    ws_thread = threading.Thread(target=ws.run_forever, kwargs={"ping_interval": 10}, daemon=True)
    ws_thread.start()

    # Wait briefly to ensure connection established
    time.sleep(1.0)

    # Call admin API to send test notification
    headers = {"Content-Type": "application/json"}
    if admin_token:
        headers["Authorization"] = f"Bearer {admin_token}"

    payload = {
        "user_id": int(user_id),
        "type": "payment_success",
        "title": "Automated test",
        "message": f"Automated notification for user {user_id}",
        "order_id": int(order_id) if order_id else None,
    }

    send_url = api_base.rstrip("/") + "/notifications/send-test/"
    print("[Test] Sending test notification via API:", send_url)
    try:
        resp = requests.post(send_url, json=payload, headers=headers, timeout=10)
        print("[API] status:", resp.status_code)
        try:
            print("[API] response:", resp.json())
        except Exception:
            print("[API] response text:", resp.text)
    except Exception as e:
        print("[API] error sending test notification:", str(e))
        ws.close()
        return 2

    print(f"[Test] Waiting up to {timeout}s for WS message...")
    ok = evt.wait(timeout=timeout)
    ws.close()
    if ok and received["flag"]:
        print("[Result] SUCCESS - Notification received via WebSocket.")
        return 0
    else:
        print("[Result] FAILURE - No notification received within timeout.")
        return 3


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", required=False, default="http://127.0.0.1:8000/api/", help="API base URL (with /api/)")
    parser.add_argument("--user", required=True, help="Target user id to receive notification")
    parser.add_argument("--order", required=False, help="Order id (optional)")
    parser.add_argument("--admin-token", required=True, help="Admin JWT token (Bearer) to call send-test endpoint")
    parser.add_argument("--timeout", required=False, type=int, default=10, help="Timeout seconds to wait for WS message")

    args = parser.parse_args()

    rc = run_test(args.api, args.user, args.order, args.admin_token, timeout=args.timeout)
    sys.exit(rc)


if __name__ == "__main__":
    main()


