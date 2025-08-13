# Stop dev helper (placeholder) - attempts to kill common dev processes (node on ports 8082, 3000)
Write-Host "Stopping dev processes..."
$ports = @(8082,3000)
foreach ($p in $ports) {
  try {
    $pid = (Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
    if ($pid) {
      Write-Host "Killing process $pid on port $p"
      Stop-Process -Id $pid -Force
    }
  } catch {}
}
Write-Host "Done."
