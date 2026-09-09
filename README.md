# n8n Automation & Workflow Management Workspace

## 📌 Purpose of this Directory
This workspace is dedicated exclusively to **n8n Automation Engineering and Workflow Management**.

All legacy web application code has been cleared so that AI assistant sessions and developers can focus solely on:
- Designing and authoring n8n workflows (JSON schemas, nodes, connections).
- Managing workflows via the n8n Public API (Create, Read, Update, Delete, Activate).
- Triggering and validating complex automated pipelines, webhooks, and sub-workflows.

---

## ⚙️ Configuration (`.env`)
The environment configuration is stored in [`.env`](file:///.env):
```env
N8N_HOST=http://localhost:5678
N8N_API_KEY=your_n8n_api_key_here
```

---

## 🛠️ Workspace Structure
```text
c:\Tuition Management/
├── .env                  # n8n instance URL and API Key
├── README.md             # Workspace context and documentation
├── workflows/            # Workflow definition JSON files (for backup and deployment)
└── scripts/              # PowerShell helper scripts for managing n8n via REST API
    └── n8n_cli.ps1       # CLI utility for workflow management (list, get, deploy, delete)
```

---

## 🚀 Quick Commands (`scripts/n8n_cli.ps1`)

### 1. List all active workflows in n8n:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\n8n_cli.ps1 -Action list
```

### 2. Get details of a workflow:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\n8n_cli.ps1 -Action get -WorkflowId <WORKFLOW_ID>
```

### 3. Deploy a workflow from JSON:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\n8n_cli.ps1 -Action deploy -File .\workflows\my_workflow.json
```

### 4. Delete a workflow:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\n8n_cli.ps1 -Action delete -WorkflowId <WORKFLOW_ID>
```
