#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python -m compileall -q contracts
python -m pytest -q tests/test_contract.py tests/test_parity.py
(cd frontend && npm test)
echo "Offline contract and frontend tests passed. Not a StudioNet consensus proof."
