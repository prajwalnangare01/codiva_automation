param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("list", "get", "deploy", "delete", "activate", "deactivate")]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [string]$WorkflowId,

    [Parameter(Mandatory=$false)]
    [string]$File
)

# Load environment variables from .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
        }
    }
}

$baseUrl = $env:N8N_HOST
if (-not $baseUrl) { $baseUrl = "http://localhost:5678" }
$baseUrl = "$baseUrl/api/v1"

$apiKey = $env:N8N_API_KEY
if (-not $apiKey) {
    Write-Error "N8N_API_KEY not found in .env"
    exit 1
}

$headers = @{
    'X-N8N-API-KEY' = $apiKey
    'Content-Type' = 'application/json'
}

switch ($Action) {
    "list" {
        Write-Host "Fetching workflows from $baseUrl..." -ForegroundColor Cyan
        $res = Invoke-RestMethod -Uri "$baseUrl/workflows" -Headers $headers -Method Get
        Write-Host "Found $($res.data.Count) workflow(s):" -ForegroundColor Green
        foreach ($wf in $res.data) {
            $status = if ($wf.active) { "[Active]" } else { "[Inactive]" }
            Write-Host "  - [$($wf.id)] $($wf.name) $status"
        }
    }

    "get" {
        if (-not $WorkflowId) { Write-Error "WorkflowId is required for 'get'"; exit 1 }
        $res = Invoke-RestMethod -Uri "$baseUrl/workflows/$WorkflowId" -Headers $headers -Method Get
        $res | ConvertTo-Json -Depth 10
    }

    "deploy" {
        if (-not $File -or -not (Test-Path $File)) { Write-Error "Valid File path is required for 'deploy'"; exit 1 }
        $rawJson = [System.IO.File]::ReadAllText($File, [System.Text.Encoding]::UTF8)
        Write-Host "Deploying workflow from $File..." -ForegroundColor Cyan
        $res = Invoke-RestMethod -Uri "$baseUrl/workflows" -Headers $headers -Method Post -Body $rawJson
        Write-Host "Workflow deployed successfully!" -ForegroundColor Green
        Write-Host "  ID: $($res.id)"
        Write-Host "  Name: $($res.name)"
        Write-Host "  URL: $env:N8N_HOST/workflow/$($res.id)"
    }

    "delete" {
        if (-not $WorkflowId) { Write-Error "WorkflowId is required for 'delete'"; exit 1 }
        Write-Host "Deleting workflow $WorkflowId..." -ForegroundColor Yellow
        $res = Invoke-RestMethod -Uri "$baseUrl/workflows/$WorkflowId" -Headers $headers -Method Delete
        Write-Host "Workflow $WorkflowId deleted successfully." -ForegroundColor Green
    }

    "activate" {
        if (-not $WorkflowId) { Write-Error "WorkflowId is required for 'activate'"; exit 1 }
        $res = Invoke-RestMethod -Uri "$baseUrl/workflows/$WorkflowId/activate" -Headers $headers -Method Post
        Write-Host "Workflow $WorkflowId activated." -ForegroundColor Green
    }

    "deactivate" {
        if (-not $WorkflowId) { Write-Error "WorkflowId is required for 'deactivate'"; exit 1 }
        $res = Invoke-RestMethod -Uri "$baseUrl/workflows/$WorkflowId/deactivate" -Headers $headers -Method Post
        Write-Host "Workflow $WorkflowId deactivated." -ForegroundColor Green
    }
}
