Write-Host "=== N8N WORKFLOWS ==="
try {
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match '^\s*([^#=]+)=(.*)$') {
                [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
            }
        }
    }
    $hostUrl = $env:N8N_HOST
    if (-not $hostUrl) { $hostUrl = "http://localhost:5678" }
    $apiKey = $env:N8N_API_KEY
    $res = Invoke-RestMethod -Uri "$hostUrl/api/v1/workflows" -Headers @{'X-N8N-API-KEY'=$apiKey}
    Write-Host "N8N reachable. Found $($res.data.Count) workflows:"
    foreach ($wf in $res.data) {
        Write-Host "  ID: $($wf.id) | Name: $($wf.name) | Active: $($wf.active)"
    }
} catch {
    Write-Host "N8N error: $_"
}

Write-Host "`n=== N8N CREDENTIALS (SCHEMA/NAMES) ==="
try {
    $creds = Invoke-RestMethod -Uri "$hostUrl/api/v1/credentials" -Headers @{'X-N8N-API-KEY'=$apiKey}
    Write-Host "Found $($creds.data.Count) credentials:"
    foreach ($c in $creds.data) {
        Write-Host "  ID: $($c.id) | Name: $($c.name) | Type: $($c.type)"
    }
} catch {
    Write-Host "Credentials error: $_"
}

Write-Host "`n=== OLLAMA CHECK ==="
try {
    $ollama = Invoke-RestMethod -Uri 'http://localhost:11434/api/tags' -TimeoutSec 4
    Write-Host "Ollama reachable. Models:"
    foreach ($m in $ollama.models) {
        Write-Host "  - $($m.name) (size: $([math]::Round($m.size / 1GB, 2)) GB)"
    }
} catch {
    Write-Host "Ollama not reachable: $_"
}

Write-Host "`n=== COMFYUI CHECK ==="
try {
    $comfy = Invoke-RestMethod -Uri 'http://127.0.0.1:8188/system_stats' -TimeoutSec 4
    Write-Host "ComfyUI reachable."
    $comfy | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "ComfyUI not reachable: $_"
}

Write-Host "`n=== GPU / HARDWARE CHECK ==="
try {
    nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader
} catch {
    Write-Host "nvidia-smi error: $_"
}

Write-Host "`n=== DOCKER CONTAINERS ==="
try {
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
} catch {
    Write-Host "docker error: $_"
}
