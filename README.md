# BudgetPro — Advanced Budgeting App (MERN Stack)

MongoDB · Express · React · Node.js — a full-featured personal budgeting application, built as a portfolio-grade MERN project.

![Stack](https://img.shields.io/badge/stack-MERN-6366f1) ![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF) ![License](https://img.shields.io/badge/license-MIT-green)

**Repo:** github.com/Asnyder0328/budgetpro-mern · **Deploy:** see [DEPLOY.md](DEPLOY.md) (Render/Railway, single-service) · **GitHub setup:** see [GITHUB.md](GITHUB.md)

## Features

**Dashboard**
- Net worth across all accounts, monthly income / expenses / net, savings rate
- Month-over-month change %, 6-month cash-flow chart, next-month forecast (3-month moving average)
- **Net-worth area chart** (Plaid-style filled trend) + **stacked spending-mix bars** by category per month
- Spending-by-category donut (all charts are custom SVG — no chart library), budget health, goal progress

**Insights (new)**
- Rules engine over your real data: savings-rate verdict vs the 20% target, spending up/down vs last month
- Biggest category riser, average daily spend + month-end projection, largest purchase callout
- Full 50/30/20 check (needs / wants / saved), top merchants, budget-vs-actual panel

**Budgets (advanced)**
- Per-category monthly limits with live spent / remaining / percent
- Status engine: on-track / warning at 80% (configurable threshold) / over budget
- Month-end projection from daily burn rate, copy-last-month budgets, totals row

**Transactions**
- Full CRUD, filter by type / category / account / date range, full-text search, pagination-ready API
- Bulk import endpoint + **CSV export**

**Accounts** — checking / savings / credit / cash / investment, live balances computed from transactions, net-worth calculation

**Savings Goals** — target + contributions history, progress, priority, ETA at a given monthly contribution, auto-complete at target

**Recurring** — weekly / biweekly / monthly / quarterly / yearly rules with a `generate` endpoint that materializes due transactions

**Analytics API** — summary, category breakdown, monthly trend + forecast, budget-vs-actual, top merchants

**Auth & Data**
- JWT auth (register / login / profile), bcrypt password hashing
- 14 default categories auto-seeded on registration, per-user data isolation on every route

## Quick Start

```bash
# 1. Install
npm run install:all        # or: cd backend && npm i; cd ../frontend && npm i

# 2. API (port 5001) — no local MongoDB needed, it falls back to in-memory Mongo for dev
cd backend && npm run seed   # demo@budgetpro.app / demo1234 — 93 transactions, 6 months of history
npm run dev

# 3. Web (port 5173, proxies /api → :5001)
cd frontend && npm run dev
```

For a real database, set `MONGO_URI` in `backend/.env` (see `.env.example`) or run `docker compose up`.

## API Reference (all `/api`, JWT required except auth/health)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` `POST /auth/login` `GET/PUT /auth/me` |
| Accounts | `GET/POST /accounts` `PUT/DELETE /accounts/:id` (live balance + net worth) |
| Transactions | `GET/POST /transactions` (filter/search/paginate) `PUT/DELETE /transactions/:id` `POST /transactions/bulk` `GET /transactions/export/csv` |
| Budgets | `GET/POST /budgets?month=YYYY-MM` `PUT/DELETE /budgets/:id` `POST /budgets/copy` |
| Goals | `GET/POST /goals` `PUT/DELETE /goals/:id` `POST /goals/:id/contribute` |
| Categories | `GET/POST /categories` `DELETE /categories/:id` |
| Analytics | `GET /analytics/summary` `/category-breakdown` `/monthly-trend` `/budget-vs-actual` `/top-merchants` `/net-worth-trend` `/category-trend` `/insights` |
| Recurring | `GET/POST /recurring` `PUT/DELETE /recurring/:id` `POST /recurring/generate` |

## Project Structure

```
budget-app-mern/
├── backend/          Express + Mongoose API
│   ├── server.js
│   └── src/{config,middleware,models,routes,utils,seed.js,test-api.js}
└── frontend/         Vite + React SPA
    └── src/{components/Charts.jsx, context/AuthContext.jsx, pages/, utils/api.js}
```

## Tests

```bash
cd backend && npm test    # 22 end-to-end API tests (in-memory Mongo)
cd frontend && npm run build   # verified production build
```

Production mode is a single service: Express serves the React build + API on one port (see `DEPLOY.md`, `render.yaml`, `railway.json`). CI (`.github/workflows/ci.yml`) runs the API tests + frontend build on every push.

## Roadmap Ideas
- Bank sync via Plaid, receipt OCR, multi-currency conversion, shared household budgets, email alerts at 80%/100%
