function Test-ServicePort {
    param($HostName, $Port, $TimeoutMs=1000)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $iar = $tcpClient.BeginConnect($HostName, $Port, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
        if ($wait -and $tcpClient.Connected) {
            $tcpClient.EndConnect($iar)
            $tcpClient.Close()
            return $true
        } else {
            $tcpClient.Close()
            return $false
        }
    } catch {
        return $false
    }
}

Write-Host "Port 5678 (n8n): " (Test-ServicePort "127.0.0.1" 5678)
Write-Host "Port 11434 (Ollama): " (Test-ServicePort "127.0.0.1" 11434)
Write-Host "Port 8188 (ComfyUI): " (Test-ServicePort "127.0.0.1" 8188)
Write-Host "Port 5432 (PostgreSQL): " (Test-ServicePort "127.0.0.1" 5432)
Write-Host "Port 8080 (SearXNG/Other): " (Test-ServicePort "127.0.0.1" 8080)

# Check running processes
Get-Process | Where-Object { $_.ProcessName -match "n8n|ollama|comfy|python|docker|node|postgres" } | Select-Object Id, ProcessName, Path | Format-Table -AutoSize
