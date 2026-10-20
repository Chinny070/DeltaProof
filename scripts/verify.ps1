$ErrorActionPreference='Stop'
Set-Location (Join-Path $PSScriptRoot '..')
python -m compileall -q contracts tests
python -m pytest -q tests/test_contract.py tests/test_contract_v2.py tests/test_parity.py
Push-Location frontend
try { npm run check } finally { Pop-Location }
Write-Host 'Offline tests passed; StudioNet consensus not verified here.'
