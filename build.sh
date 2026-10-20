#!/usr/bin/env bash
# Compatibility entry point. React is always included in production builds.
set -e
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/scripts/build.mjs" "$@"
