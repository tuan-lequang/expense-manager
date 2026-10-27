#!/usr/bin/env bash
set -euo pipefail

cd /workspace/expense-manager
export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/workspace/.cache/npm}"

node --input-type=module -e '
if (process.versions.node !== "24.19.0") {
  throw new Error("Use Node.js 24.19.0 from .nvmrc before installing this project.");
}
'

npm ci --no-fund
npm run build
