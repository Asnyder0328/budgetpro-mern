# Deploying BudgetPro Live

BudgetPro runs in production as **one service**: Express serves the API *and* the built React app, so there's no CORS / split-hosting headache. You only need two free accounts.

## Step 1 — Database: MongoDB Atlas (free, ~5 min)
1. Go to https://www.mongodb.com/atlas → create a free **M0** cluster.
2. Database Access → add a user. Network Access → allow `0.0.0.0/0`.
3. Connect → Drivers → copy the connection string, e.g.
   `mongodb+srv://USER:PASS@cluster.mongodb.net/budgetpro?retryWrites=true&w=majority`

## Step 2a — Easiest host: Render (free)
1. Push this repo to GitHub (see `GITHUB.md` / commands below).
2. https://dashboard.render.com → **New → Blueprint** → select this repo (it reads `render.yaml`).
3. Set `MONGO_URI` to your Atlas string when prompted. `JWT_SECRET` is auto-generated.
4. After first deploy, open the service **Shell** and run: `cd backend && npm run seed`
   to load the demo account. Your live URL will be like `https://budgetpro-xxxx.onrender.com`
   *(Free tier sleeps after inactivity — first load can take ~30s.)*

## Step 2b — Alternative: Railway
1. https://railway.app → New Project → Deploy from GitHub repo (it reads `railway.json`).
2. Add variables: `MONGO_URI` (Atlas string), `JWT_SECRET` (any long random string), `NODE_ENV=production`.
3. Run the seed once from the service console: `cd backend && npm run seed`.

## Step 2c — Alternative: Vercel (frontend) + Render (API)
Only if you want a split deploy: set `VITE_API_URL=https://your-api.onrender.com/api` when building the frontend.

## Verify the live deploy
- `GET https://YOUR-URL/api/health` → `{"status":"ok", ...}`
- Log in with `demo@budgetpro.app / demo1234`, check Dashboard charts, Insights, and Budgets load.
- Register a fresh account to confirm per-user isolation.

## Local production rehearsal (already verified)
```bash
cd frontend && npm run build && cd ..
cd backend && NODE_ENV=production node server.js
# → http://localhost:5001 serves both the app and /api
```
