# Render Deployment Guide (Combined Web Service)

This guide provides step-by-step instructions for deploying the **Interview Management Platform** to Render as a combined single Web Service (Express API + built React frontend).

---

## Architecture Overview

- **Service Type**: Render Web Service (Node.js)
- **Frontend**: React + Vite compiled to `client/dist` and served statically by Express.
- **Backend**: Express API served at `/api/*` endpoints.
- **Database**: SQLite via Prisma ORM persisted to a Render Persistent Disk.

---

## Quick Start (Render Blueprint 1-Click Deployment)

### 1. Push to GitHub
Ensure your latest code with `render.yaml` is pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure deployment for Render"
git push origin main
```

### 2. Connect Repository on Render
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` blueprint specification.

### 3. Configure Environment Variables in Render Dashboard
During Blueprint setup (or in the service settings under **Environment**), set the following required secrets (marked `sync: false` in `render.yaml`):

| Environment Variable | Description | Example / Note |
|---|---|---|
| `JWT_SECRET` | Secret key used for signing JWT tokens | `a_long_random_secure_secret_string` |
| `OPENAI_API_KEY` | OpenAI API key for AI summary & interview features | `sk-proj-...` |

---

## Database & Persistent Disk Requirements

> [!IMPORTANT]
> **Render Persistent Disk requires the Starter plan or higher** (approx. \$7/mo for web service + \$0.25/mo for disk). On Render's Free tier, persistent disks are not supported, meaning database files on local disk reset on every redeploy or server restart.

### First-Deploy Database Migration Step
Once the service builds and deploys for the first time on Render:

1. In the Render Dashboard, open your web service (`interview-summary`).
2. Click on **Shell** in the left navigation panel to open a live terminal.
3. Run the Prisma migration command to initialize the database schema on the persistent disk:
   ```bash
   npm run prisma:migrate --prefix server
   ```
4. Verify the database initialized cleanly at `/var/data/app.db`.

---

## Health Check & Verification

Render uses the `/api/health` endpoint for readiness probes:
- **Health Check URL**: `https://<your-render-app-name>.onrender.com/api/health`
- **Expected Response**: `200 OK` `{ "status": "ok" }`

### Verification Steps:
1. **Frontend App**: Navigate to `https://<your-render-app-name>.onrender.com/` in your browser to verify the SPA loads.
2. **SPA Fallback Routing**: Deep link or refresh on a nested route (e.g. `/login` or `/candidates`) to ensure Express routes correctly to `index.html`.
3. **API Endpoint**: Verify API calls respond without CORS errors (same-origin).

---

## Future Scaling Option (Decoupled Service Topology)

If traffic grows and you want to separate frontend and backend hosting:
1. Create a **Render Static Site** for `client/`.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Set environment variable: `VITE_API_URL=https://<your-backend-api>.onrender.com/api`
2. Update the **Render Web Service** for `server/` with `CLIENT_URL=https://<your-frontend-static-site>.onrender.com`.

No frontend code changes are needed when switching between combined and decoupled deployments.
