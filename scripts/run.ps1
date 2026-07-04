param(
  [ValidateSet("build", "test", "verify", "preview", "preview-lan")]
  [string]$Task = "build"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$BundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (Test-Path $BundledNode) {
  $Node = $BundledNode
} else {
  $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if (-not $NodeCommand) {
    throw "Node.js was not found. Install Node.js or run this inside the Codex runtime."
  }
  $Node = $NodeCommand.Source
}

Push-Location $Root
try {
  switch ($Task) {
    "build" {
      & $Node "scripts/build-static.js"
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
      & $Node "scripts/verify-static-app.js" "dist"
    }
    "test" {
      & $Node "--test" "tests/domain.test.js"
    }
    "verify" {
      & $Node "scripts/verify-static-app.js" "."
    }
    "preview" {
      & $Node "scripts/serve.js" "--root" "dist"
    }
    "preview-lan" {
      & $Node "scripts/serve.js" "--root" "dist" "--host" "0.0.0.0"
    }
  }
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
