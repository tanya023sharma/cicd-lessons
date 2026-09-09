#!/usr/bin/env bash
set -euo pipefail

# Change these values if the project layout or development port changes.
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT"
FRONTEND_PORT=5173
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}"
LOG_DIR="$PROJECT_ROOT/logs"
FRONTEND_LOG="$LOG_DIR/frontend.log"

FRONTEND_PID=""
CLEANED_UP=false

# Stop every child process started by this script when Ctrl+C or a termination
# signal is received.
cleanup() {
  if [[ "$CLEANED_UP" == true ]]; then
    return
  fi
  CLEANED_UP=true
  printf '\nStopping CA Buddy...\n'
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup SIGINT SIGTERM EXIT

# This project is a frontend-only Vite app; there is no backend process to start.
printf '%s\n' 'Backend: none detected; starting the frontend-only application.'

# Make sure the frontend log directory exists before starting Vite.
mkdir -p "$LOG_DIR"

# Install dependencies only when node_modules is absent.
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  printf '%s\n' 'Installing frontend dependencies...'
  (cd "$FRONTEND_DIR" && npm install) >>"$FRONTEND_LOG" 2>&1
fi

# Start Vite in the background and keep its output in a predictable log file.
printf 'Starting frontend on %s...\n' "$FRONTEND_URL"
(cd "$FRONTEND_DIR" && npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT") >>"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Wait until the frontend responds, or fail after roughly 30 seconds.
printf 'Waiting for the frontend to become reachable...\n'
for ((attempt = 1; attempt <= 30; attempt++)); do
  if curl --silent --show-error --fail --output /dev/null "$FRONTEND_URL"; then
    break
  fi

  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    printf 'Error: the frontend stopped before it became reachable. See %s\n' "$FRONTEND_LOG" >&2
    exit 1
  fi

  sleep 1
done

if ! curl --silent --show-error --fail --output /dev/null "$FRONTEND_URL"; then
  printf 'Error: the frontend did not become reachable within 30 seconds. See %s\n' "$FRONTEND_LOG" >&2
  exit 1
fi

# Open the app in Google Chrome when available, with platform fallbacks.
printf 'Opening the frontend in a browser...\n'
case "$(uname -s)" in
  Linux*)
    if command -v google-chrome >/dev/null 2>&1; then
      google-chrome "$FRONTEND_URL" >/dev/null 2>&1 &
    elif command -v google-chrome-stable >/dev/null 2>&1; then
      google-chrome-stable "$FRONTEND_URL" >/dev/null 2>&1 &
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
      printf 'Google Chrome was not found; opened the URL with the system browser: %s\n' "$FRONTEND_URL"
    else
      printf 'Google Chrome was not found. Open this URL manually: %s\n' "$FRONTEND_URL"
    fi
    ;;
  Darwin*)
    open -a 'Google Chrome' "$FRONTEND_URL" >/dev/null 2>&1 &
    ;;
  MINGW*|MSYS*|CYGWIN*)
    if command -v start >/dev/null 2>&1; then
      start chrome "$FRONTEND_URL" >/dev/null 2>&1 &
    else
      printf 'Google Chrome launcher was not found. Open this URL manually: %s\n' "$FRONTEND_URL"
    fi
    ;;
  *)
    printf 'Unsupported platform. Open this URL manually: %s\n' "$FRONTEND_URL"
    ;;
esac

printf 'CA Buddy is running at %s. Press Ctrl+C to stop it.\n' "$FRONTEND_URL"

# Keep this launcher in the foreground so Ctrl+C reaches the cleanup trap.
wait "$FRONTEND_PID"
