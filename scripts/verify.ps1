$ErrorActionPreference='Stop'
Set-Location (Join-Path $PSScriptRoot '..')
python -m compileall -q contracts
python -m pytest -q tests/test_contract.py tests/test_parity.py
Push-Location frontend
try { npm test } finally { Pop-Location }
Write-Host 'Offline tests passed; StudioNet consensus not verified here.'
