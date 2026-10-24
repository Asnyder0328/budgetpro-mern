// Budget health + forecasting helpers — pure functions, unit-testable.

function monthRange(monthStr) {
  // monthStr: YYYY-MM
  const [y, m] = monthStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

function currentMonthStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function budgetStatus(spent, limit, threshold = 80) {
  if (!limit) return { percent: 0, status: 'no-limit' };
  const percent = Math.round((spent / limit) * 100);
  let status = 'on-track';
  if (percent >= 100) status = 'over';
  else if (percent >= threshold) status = 'warning';
  return { percent, status, remaining: +(limit - spent).toFixed(2) };
}

function savingsRate(income, expenses) {
  if (!income) return 0;
  return Math.round(((income - expenses) / income) * 1000) / 10;
}

// Simple linear forecast: average of last N months net, projected forward
function forecastNextMonth(monthly) {
  // monthly: [{month, income, expenses}] oldest -> newest
  if (!monthly.length) return { income: 0, expenses: 0, net: 0 };
  const last3 = monthly.slice(-3);
  const avg = (k) => last3.reduce((s, m) => s + (m[k] || 0), 0) / last3.length;
  const income = Math.round(avg('income'));
  const expenses = Math.round(avg('expenses'));
  return { income, expenses, net: income - expenses, basedOnMonths: last3.length };
}

// How many months until a goal is reached at a given monthly contribution
function goalEta(goal, monthlyContribution) {
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) return { months: 0, date: new Date() };
  if (!monthlyContribution || monthlyContribution <= 0) return { months: null, date: null };
  const months = Math.ceil(remaining / monthlyContribution);
  const date = new Date(); date.setMonth(date.getMonth() + months);
  return { months, date };
}

function nextRecurringDate(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

module.exports = { monthRange, currentMonthStr, budgetStatus, savingsRate, forecastNextMonth, goalEta, nextRecurringDate };
