#!/usr/bin/env python3

import argparse
import base64
import hashlib
import secrets
import socket
import sys


GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def _generate_key() -> str:
    raw = secrets.token_bytes(16)
    return base64.b64encode(raw).decode("ascii")


def _expected_accept(key: str) -> str:
    digest = hashlib.sha1(f"{key}{GUID}".encode("ascii")).digest()
    return base64.b64encode(digest).decode("ascii")


def _subject_to_resource(bar_id: str) -> str:
    return f"/ws/market/{bar_id}/"


def probe(host: str, port: int, bar_id: str, timeout: float) -> None:
    key = _generate_key()
    resource = _subject_to_resource(bar_id)
    request = (
        f"GET {resource} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n"
        "\r\n"
    )
    with socket.create_connection((host, port), timeout=timeout) as sock:
        sock.sendall(request.encode("ascii"))
        response = bytearray()
        while b"\r\n\r\n" not in response:
            chunk = sock.recv(2048)
            if not chunk:
                break
            response.extend(chunk)
    decoded = response.decode("ascii", errors="ignore")
    lines = decoded.splitlines()
    if not lines or "101" not in lines[0]:
        print("failed: did not receive HTTP 101 switching protocols", file=sys.stderr)
        sys.exit(1)
    expected = _expected_accept(key)
    for line in lines:
        if line.lower().startswith("sec-websocket-accept:"):
            received = line.split(":", 1)[1].strip()
            if received == expected:
                print(f"ws-health ok ({host}:{port}{resource})")
                return
            print("failed: websocket accept header mismatch", file=sys.stderr)
            sys.exit(1)
    print("failed: websocket accept header missing", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Probe the market WebSocket endpoint.")
    parser.add_argument("--host", default="localhost", help="WebSocket host")
    parser.add_argument("--port", type=int, default=8000, help="WebSocket port")
    parser.add_argument(
        "--bar", default="demo", help="Bar id used in the market channel"
    )
    parser.add_argument(
        "--timeout", type=float, default=5.0, help="Socket timeout in seconds"
    )
    args = parser.parse_args()
    probe(args.host, args.port, args.bar, args.timeout)


if __name__ == "__main__":
    main()
