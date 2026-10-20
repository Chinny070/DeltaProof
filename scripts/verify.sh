#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python -m compileall -q contracts tests
python -m pytest -q tests/test_contract.py tests/test_contract_v2.py tests/test_parity.py
(cd frontend && npm run check)
echo "Offline contract and frontend tests passed. Not a StudioNet consensus proof."
