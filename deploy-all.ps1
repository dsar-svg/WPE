param([string]$Token = "")

function Deploy {
  param([string]$Dir, [string]$Project, [string]$Domain)
  Write-Host "Desplegando $Project → $Domain ..." -ForegroundColor Green
  $args = @("--cwd", $Dir, "--prod", "--yes", "--project", $Project)
  if ($Token) { $args += "--token"; $args += $Token }
  & vercel deploy @args
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ $Project desplegado" -ForegroundColor Green
  } else {
    Write-Host "  ❌ Error desplegando $Project" -ForegroundColor Red
  }
}

Write-Host "=== Construyendo los 3 proyectos ===" -ForegroundColor Cyan
npm run build:all
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== Desplegando a Vercel ===" -ForegroundColor Cyan
Deploy -Dir "dist"       -Project "pndaexpress"       -Domain "wallacepanda.com"
Deploy -Dir "dist-admin" -Project "pndaexpress-admin" -Domain "admin.wallacepanda.com"
Deploy -Dir "dist-pos"   -Project "pndaexpress-pos"   -Domain "pos.wallacepanda.com"
