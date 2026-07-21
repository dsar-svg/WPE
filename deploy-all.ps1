param([string]$Token = "")

$DISTS = @(
  @{ Dir = "dist";       Project = "wallace-panda-expres";  Domain = "wallacepandaexpress.com" }
  @{ Dir = "dist-admin"; Project = "pndaexpress-admin";     Domain = "admin.wallacepandaexpress.com" }
  @{ Dir = "dist-pos";   Project = "pndaexpress-pos";       Domain = "pos.wallacepandaexpress.com" }
)

Write-Host "=== Construyendo los 3 proyectos ===" -ForegroundColor Cyan
npm run build:all
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== Vinculando y desplegando a Vercel ===" -ForegroundColor Cyan
foreach ($item in $DISTS) {
  $dir = $item.Dir
  $proj = $item.Project
  $domain = $item.Domain
  Write-Host "`n📦 $proj → $domain" -ForegroundColor Yellow

  Write-Host "  🔗 Vinculando..." -NoNewline
  $linkArgs = @("link", "--cwd", $dir, "--project", $proj, "--yes")
  if ($Token) { $linkArgs += "--token"; $linkArgs += $Token }
  & vercel @linkArgs 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host " ✅" -ForegroundColor Green }
  else { Write-Host " ❌" -ForegroundColor Red; continue }

  Write-Host "  🚀 Desplegando..." -NoNewline
  $deployArgs = @("deploy", "--cwd", $dir, "--prod", "--yes")
  if ($Token) { $deployArgs += "--token"; $deployArgs += $Token }
  & vercel @deployArgs 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host " ✅ $domain" -ForegroundColor Green }
  else { Write-Host " ❌" -ForegroundColor Red }
}
