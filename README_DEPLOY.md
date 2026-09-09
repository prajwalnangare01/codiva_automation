# 🚀 Deploy Codiva to GitHub Actions (100% Free & PC Independent)

This setup runs your **Codiva Autonomous Instagram Publishing System** (@codiva_labs) 24/7 directly on GitHub's cloud runners.

> **Key Benefit**: You can turn off your computer entirely. GitHub will trigger and publish your posts every single day at **7:00 PM IST** and **10:00 PM IST** without requiring your PC or any paid servers.

---

## ⚡ 3-Step Setup (Takes Under 3 Minutes)

### Step 1: Create a GitHub Repository & Push Your Code

1. Go to [GitHub.com](https://github.com) and click **New Repository**.
2. Name it (e.g. `codiva-automation`) and choose **Private** (recommended so your curriculum and commit history are private).
3. Open your terminal in this directory (`c:\build automation`) and run:
   ```bash
   git init
   git add .
   git commit -m "feat: initial autonomous instagram publisher"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/codiva-automation.git
   git push -u origin main
   ```
   *(Replace `YOUR_USERNAME` and repo name with your actual GitHub repo URL)*.

---

### Step 2: Add Your 3 Secrets to GitHub

In your GitHub repository:
1. Click **Settings** (top tab).
2. On the left sidebar, click **Secrets and variables** ➔ **Actions**.
3. Click the green button **New repository secret** for each of the following:

| Secret Name | Description / Value |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API Key (found in your local `.env`) |
| `IG_ACCESS_TOKEN` | Your Meta Graph API Access Token (found in your local `.env`) |
| `IG_ACCOUNT_ID` | `17841475951559107` |

*(Note: Your `.env` file is already safely listed in `.gitignore`, so it will never be uploaded publicly).*

---

### Step 3: Enable Workflow Permissions

To allow GitHub Actions to save and update the curriculum progress counter (`data/state.json`) after each post:
1. In your GitHub repository, go to **Settings** ➔ **Actions** ➔ **General**.
2. Scroll down to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Click **Save**.

---

## 🧪 How to Test It Live

You do not need to wait until 7:00 PM or 10:00 PM to test!

1. Go to your GitHub repository and click the **Actions** tab.
2. On the left sidebar, click **Codiva Autonomous 24/7 Instagram Publisher**.
3. Click the **Run workflow** dropdown on the right:
   - For a safe simulation: select `dry_run: true` and click **Run workflow**.
   - For a real live post to @codiva_labs: leave `dry_run: false` and click **Run workflow**.
4. Click on the running job to watch the live console logs as it creates the card, uploads the image, and publishes to Instagram!

---

## 🕒 Automated Daily Schedule (IST)

| Time (IST) | Time (UTC) | Type | Format | Content |
|---|---|---|---|---|
| **7:00 PM** | 13:30 UTC | Slot 1 (LEARN) | 1080×1350 Comparison | ❌ The Bad Way vs ✅ The Pro Way + Golden Rule |
| **10:00 PM** | 16:30 UTC | Slot 2 (APPLY) | 1080×1350 Challenge | 🔍 Interactive Code Challenge [A][B][C][D] + Takeaway |

---

## 🛡️ Architecture & Resilience
- **Native SVG Rasterization**: Uses `@resvg/resvg-js` for ultra-fast C++ rendering with zero Puppeteer or Chrome memory overhead.
- **Dynamic Zero-Overlap Layout**: Text wrapping and card heights dynamically recalculate per post so text never collides.
- **AI Spike Resilience**: If Gemini encounters a rate limit or 503 high-demand spike, the runner automatically falls back to the pre-computed MERN curriculum dataset and proceeds without failing.
- **Autonomous Progression**: On every run, GitHub Actions commits the updated `data/state.json` back to your repo using `[skip ci]`.
