#!/usr/bin/env python3
"""Record a command in a pty and write it out as an asciicast v2 file.

A stand-in for `asciinema rec` when asciinema is not installed. Because it
drives the command through a pty it captures the real timing — a termcast
scenario types at its own pace and that pacing survives into the recording.

    python3 scripts/record-cast.py ~/development/termcast/examples/coding-agent.sh \
        public/demos/termcast.cast

Terminal size defaults to 100x30, which lands close to the 16:10 frame the
site draws around the player. Anything the command needs goes in the env:

    VOICE=0 AUTO=1 PAUSE=1.1 python3 scripts/record-cast.py demo.sh out.cast
"""
import fcntl
import json
import os
import pty
import select
import struct
import sys
import termios
import time

USAGE = "usage: record-cast.py <script> <out.cast> [cols] [rows]"


def record(script: str, cols: int, rows: int):
    """Run `script` under a pty, returning (start_time, [asciicast events])."""
    env = dict(os.environ)
    env.setdefault("TERM", "xterm-256color")
    # A recording is unattended, so the scenario has to drive itself and stay
    # quiet — narration is audio and would not survive into a cast anyway.
    env.setdefault("VOICE", "0")
    env.setdefault("AUTO", "1")
    env.setdefault("PAUSE", "1.1")
    env.setdefault("RUN_MODE", "demo")
    env["COLUMNS"], env["LINES"] = str(cols), str(rows)

    master, slave = pty.openpty()
    # Size the pty before the fork, so the command never sees the default 80x24.
    fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))

    pid = os.fork()
    if pid == 0:
        os.setsid()
        fcntl.ioctl(slave, termios.TIOCSCTTY, 0)
        for target in (0, 1, 2):
            os.dup2(slave, target)
        os.close(master)
        os.close(slave)
        os.execvpe("bash", ["bash", script], env)

    os.close(slave)

    events, start = [], time.time()
    while True:
        readable, _, _ = select.select([master], [], [], 0.5)
        if readable:
            try:
                chunk = os.read(master, 65536)
            except OSError:  # slave closed — the command exited
                break
            if not chunk:
                break
            elapsed = round(time.time() - start, 6)
            events.append([elapsed, "o", chunk.decode("utf-8", "replace")])
        elif os.waitpid(pid, os.WNOHANG)[0]:
            break

    os.close(master)
    return start, events


def main() -> int:
    if len(sys.argv) < 3:
        print(USAGE, file=sys.stderr)
        return 2

    script, out_path = sys.argv[1], sys.argv[2]
    cols = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    rows = int(sys.argv[4]) if len(sys.argv) > 4 else 30

    start, events = record(script, cols, rows)
    if not events:
        print("nothing was recorded — did the script run?", file=sys.stderr)
        return 1

    header = {
        "version": 2,
        "width": cols,
        "height": rows,
        "timestamp": int(start),
        "env": {"SHELL": "/bin/bash", "TERM": "xterm-256color"},
    }
    with open(out_path, "w") as fh:
        fh.write(json.dumps(header) + "\n")
        for event in events:
            fh.write(json.dumps(event) + "\n")

    size = os.path.getsize(out_path)
    print(f"{out_path}: {len(events)} events, {events[-1][0]:.1f}s, {size:,} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
