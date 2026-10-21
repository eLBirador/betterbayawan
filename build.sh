#!/usr/bin/env bash
# Compatibility entry point for the single static-site build.
set -e
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/scripts/build.mjs" "$@"
