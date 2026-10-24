# Pushing BudgetPro to GitHub

Target repo: **github.com/Asnyder0328/budgetpro-mern** (same account as taskflow-mean)

The local repo is already initialized and committed — `node_modules`, `dist`, and `.env` are gitignored.

## Once GitHub is connected (one-time)
If you haven't connected GitHub in Muse yet, use the connect link from the TaskFlow thread — it covers both repos.

Then either:

**Option A — let Muse finish it:** tell Muse "GitHub is connected, push BudgetPro" and it will create `Asnyder0328/budgetpro-mern` and push `main`.

**Option B — do it yourself (2 minutes):**
```bash
# 1. On github.com: New repository → name: budgetpro-mern → Public → Create (no README)
# 2. In this folder:
git remote add origin git@github.com:Asnyder0328/budgetpro-mern.git
git push -u origin main
```

## After pushing
- CI runs automatically (`.github/workflows/ci.yml`): backend API tests + frontend build.
- To go live, follow `DEPLOY.md` — Render Blueprint reads `render.yaml` directly from this repo.
- Add the live URL + repo link to your resume Projects section (slot 2 is still open) and LinkedIn.
