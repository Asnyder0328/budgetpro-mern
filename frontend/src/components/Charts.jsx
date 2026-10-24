// Lightweight SVG charts — no chart library dependency.
export function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.total, 0) || 1;
  const colors = ['#6366f1','#22c55e','#f59e0b','#06b6d4','#ec4899','#a855f7','#ef4444','#64748b','#eab308'];
  let acc = 0;
  const R = 70, C = 2 * Math.PI * R;
  return (<svg viewBox="0 0 200 200" style={{ width: 220 }}>
    {data.map((d, i) => { const frac = d.total / total; const el = (<circle key={i} cx="100" cy="100" r={R} fill="none" stroke={colors[i % colors.length]} strokeWidth="28" strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acc * C} transform="rotate(-90 100 100)" />); acc += frac; return el; })}
    <text x="100" y="96" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a">${total.toLocaleString()}</text>
    <text x="100" y="114" textAnchor="middle" fontSize="11" fill="#64748b">total spent</text>
  </svg>);
}
export function Bars({ trend }) {
  const max = Math.max(...trend.flatMap(t => [t.income, t.expenses]), 1);
  return (<div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', height: 170, paddingTop: 10 }}>
    {trend.map(t => (<div key={t.month} style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-end', height: 130 }}>
        <div title={`Income ${t.income}`} style={{ width: 16, height: `${(t.income / max) * 130}px`, background: '#22c55e', borderRadius: 4 }} />
        <div title={`Expenses ${t.expenses}`} style={{ width: 16, height: `${(t.expenses / max) * 130}px`, background: '#6366f1', borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{t.month.slice(5)}/{t.month.slice(2, 4)}</div>
    </div>))}
  </div>);
}
// Plaid-style filled area chart for a single series (e.g. net worth)
export function AreaChart({ data, valueKey = 'netWorth', color = '#6366f1', height = 160 }) {
  if (!data?.length) return null;
  const W = 560, H = height, P = 28;
  const vals = data.map(d => d[valueKey]);
  const min = Math.min(...vals) * 0.98, max = Math.max(...vals) * 1.02 || 1;
  const x = (i) => P + (i * (W - 2 * P)) / Math.max(1, data.length - 1);
  const y = (v) => H - P - ((v - min) / (max - min || 1)) * (H - 2 * P);
  const pts = data.map((d, i) => `${x(i)},${y(d[valueKey])}`).join(' ');
  const area = `${P},${H - P} ${pts} ${x(data.length - 1)},${H - P}`;
  return (<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>
    <polygon points={area} fill="url(#ag)" />
    <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" />
    {data.map((d, i) => <g key={i}><circle cx={x(i)} cy={y(d[valueKey])} r="3.5" fill={color}><title>{d.month}: ${d[valueKey].toLocaleString()}</title></circle><text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#64748b">{d.month.slice(5)}/{d.month.slice(2, 4)}</text></g>)}
    <text x={P} y={14} fontSize="11" fill="#64748b">high ${Math.max(...vals).toLocaleString()}</text>
    <text x={W - P} y={14} textAnchor="end" fontSize="11" fontWeight="700" fill="#0f172a">${vals[vals.length - 1].toLocaleString()}</text>
  </svg>);
}

// Stacked bars: spending composition per month across top categories
export function StackedBars({ categories, series }) {
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#06b6d4', '#ec4899', '#a855f7'];
  const max = Math.max(...series.map(r => categories.reduce((s, c) => s + (r[c] || 0), 0)), 1);
  return (<div>
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', height: 170 }}>
      {series.map(r => { const total = categories.reduce((s, c) => s + (r[c] || 0), 0); return (<div key={r.month} style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column-reverse', height: 130, borderRadius: 5, overflow: 'hidden' }}>
          {categories.map((c, i) => r[c] ? <div key={c} title={`${c}: $${r[c]}`} style={{ height: `${(r[c] / max) * 130}px`, background: colors[i % colors.length] }} /> : null)}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{r.month.slice(5)}/{r.month.slice(2, 4)} · ${Math.round(total).toLocaleString()}</div>
      </div>); })}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>{categories.map((c, i) => <span key={c} style={{ fontSize: 12 }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], marginRight: 5 }} />{c}</span>)}</div>
  </div>);
}

export function Progress({ percent, status }) {
  const color = status === 'over' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e';
  return (<div style={{ background: '#e2e8f0', borderRadius: 99, height: 10, overflow: 'hidden' }}><div style={{ width: `${Math.min(100, percent)}%`, height: '100%', background: color, transition: 'width .4s' }} /></div>);
}
