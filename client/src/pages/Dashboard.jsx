import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money, fmtDate } from '../utils/format.js';
import { StatCard, PageLoader, EmptyState } from '../components/ui.jsx';
import { CategoryDoughnut, TrendLine } from '../components/charts.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/expenses/summary/by-category', { params: { period: 'month' } }),
      api.get('/expenses/summary/trend', { params: { months: 6 } }),
      api.get('/budgets/alerts'),
    ])
      .then(([d, c, t, a]) => {
        setData(d.data);
        setByCategory(c.data);
        setTrend(t.data);
        setAlerts(a.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const m = data.month;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-500">Here's your financial snapshot for {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income (this month)" value={money(m.income, cur)} icon="💰" accent="green" />
        <StatCard label="Expenses (this month)" value={money(m.expense, cur)} icon="💸" accent="red" />
        <StatCard label="Net savings" value={money(m.savings, cur)} sub={`${m.savingsRate}% savings rate`} icon="🏦" accent={m.savings >= 0 ? 'brand' : 'amber'} />
        <StatCard label="Active goals" value={data.activeGoals} sub={`${data.budgetsExceeded}/${data.budgetsTotal} budgets over limit`} icon="🏆" accent="amber" />
      </div>

      {/* Budget alerts */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-amber-800">⚠️ Budget alerts</div>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {alerts.map((b) => (
              <li key={b._id} className="flex items-center justify-between">
                <span>{b.categoryName} — {b.status === 'exceeded' ? 'over budget' : `${Math.round(b.ratio * 100)}% used`}</span>
                <span className="font-medium">{money(b.spent, cur)} / {money(b.limit, cur)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-700">Spending trend (6 months)</h3>
          <div className="h-72">
            {trend.some((t) => t.total > 0)
              ? <TrendLine labels={trend.map((t) => t.label)} data={trend.map((t) => t.total)} />
              : <EmptyState icon="📈" title="No spending yet" subtitle="Add expenses to see your trend." />}
          </div>
        </div>
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-700">By category</h3>
          <div className="h-72">
            {byCategory.length
              ? <CategoryDoughnut labels={byCategory.map((c) => c.categoryName)} data={byCategory.map((c) => c.total)} colors={byCategory.map((c) => c.color)} />
              : <EmptyState icon="🥧" title="No data" subtitle="This month's expenses will appear here." />}
          </div>
        </div>
      </div>

      {/* Upcoming recurring */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">Upcoming recurring expenses</h3>
          <Link to="/recurring" className="text-sm font-medium text-brand-600 hover:underline">Manage →</Link>
        </div>
        {data.upcomingRecurring.length ? (
          <div className="divide-y divide-slate-100">
            {data.upcomingRecurring.map((r) => (
              <div key={r._id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-700">{r.description || r.categoryName}</p>
                  <p className="text-xs text-slate-400">{r.frequency} · next {fmtDate(r.nextRun)}</p>
                </div>
                <span className="font-semibold text-slate-700">{money(r.amount, cur)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-slate-400">No recurring expenses set up yet.</p>
        )}
      </div>
    </div>
  );
}
