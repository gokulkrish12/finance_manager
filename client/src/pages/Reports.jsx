import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money } from '../utils/format.js';
import { PageLoader, StatCard, ProgressBar } from '../components/ui.jsx';
import { IncomeExpenseBar, BudgetBar } from '../components/charts.jsx';

const TABS = [
  { key: 'expenses', label: 'Expenses' },
  { key: 'budget', label: 'Budget' },
  { key: 'income', label: 'Income vs Expense' },
];

export default function Reports() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';
  const [tab, setTab] = useState('expenses');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState(null);
  const [budget, setBudget] = useState(null);
  const [income, setIncome] = useState(null);
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/reports/expenses', { params: { period } }),
      api.get('/reports/budget'),
      api.get('/reports/income', { params: { period } }),
    ])
      .then(([e, b, i]) => { setExpense(e.data); setBudget(b.data); setIncome(i.data); })
      .finally(() => setLoading(false));
  }, [period]);

  const download = async (type, format) => {
    setDownloading(`${type}-${format}`);
    try {
      const res = await api.get(`/reports/${type}/export`, { params: { period, format }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch {
      toast.error('Export failed');
    } finally {
      setDownloading('');
    }
  };

  const DownloadButtons = ({ type }) => (
    <div className="flex gap-2">
      <button className="btn-ghost py-1.5 text-sm" onClick={() => download(type, 'csv')} disabled={downloading === `${type}-csv`}>
        {downloading === `${type}-csv` ? '…' : '⬇ CSV'}
      </button>
      <button className="btn-ghost py-1.5 text-sm" onClick={() => download(type, 'pdf')} disabled={downloading === `${type}-pdf`}>
        {downloading === `${type}-pdf` ? '…' : '⬇ PDF'}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500">Analyze your finances and export the details.</p>
        </div>
        <select className="input max-w-[180px]" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="week">Last 7 days</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === t.key ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : (
        <>
          {/* Expense report */}
          {tab === 'expenses' && expense && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard label="Total spent" value={money(expense.total, cur)} icon="💸" accent="red" />
                <StatCard label="Transactions" value={expense.count} icon="🧾" accent="brand" />
              </div>
              <div className="card">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700">Breakdown by category</h3>
                  <DownloadButtons type="expenses" />
                </div>
                {expense.byCategory.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No expenses in this period.</p>
                ) : (
                  <div className="space-y-3">
                    {expense.byCategory.map((c) => (
                      <div key={c.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-slate-600">{c.name}</span>
                          <span className="font-medium text-slate-700">{money(c.amount, cur)} <span className="text-slate-400">({c.pct}%)</span></span>
                        </div>
                        <ProgressBar value={c.pct} max={100} color="bg-brand-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Budget report */}
          {tab === 'budget' && budget && (
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">Spending vs budget</h3>
                <DownloadButtons type="budget" />
              </div>
              {budget.rows.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No budgets set up yet.</p>
              ) : (
                <>
                  <div className="mb-6 h-64">
                    <BudgetBar labels={budget.rows.map((r) => r.category)} limits={budget.rows.map((r) => r.limit)} spent={budget.rows.map((r) => r.spent)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                          <th className="py-2 pr-2 font-medium">Category</th>
                          <th className="py-2 pr-2 font-medium">Period</th>
                          <th className="py-2 pr-2 text-right font-medium">Limit</th>
                          <th className="py-2 pr-2 text-right font-medium">Spent</th>
                          <th className="py-2 text-right font-medium">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {budget.rows.map((r) => (
                          <tr key={r.category}>
                            <td className="py-2.5 pr-2 font-medium text-slate-700">{r.category}</td>
                            <td className="py-2.5 pr-2 capitalize text-slate-500">{r.period}</td>
                            <td className="py-2.5 pr-2 text-right text-slate-600">{money(r.limit, cur)}</td>
                            <td className="py-2.5 pr-2 text-right text-slate-600">{money(r.spent, cur)}</td>
                            <td className={`py-2.5 text-right font-semibold ${r.variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{money(r.variance, cur)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Income vs expense */}
          {tab === 'income' && income && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Total income" value={money(income.totalIncome, cur)} icon="💰" accent="green" />
                <StatCard label="Total expense" value={money(income.totalExpense, cur)} icon="💸" accent="red" />
                <StatCard label="Net savings" value={money(income.savings, cur)} icon="🏦" accent={income.savings >= 0 ? 'brand' : 'amber'} />
              </div>
              <div className="card">
                <h3 className="mb-4 font-semibold text-slate-700">Income vs Expense</h3>
                <div className="h-64">
                  <IncomeExpenseBar labels={['This period']} income={[income.totalIncome]} expense={[income.totalExpense]} />
                </div>
              </div>
              {income.bySource.length > 0 && (
                <div className="card">
                  <h3 className="mb-3 font-semibold text-slate-700">Income by source</h3>
                  <div className="space-y-2">
                    {income.bySource.map((s) => (
                      <div key={s.source} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{s.source}</span>
                        <span className="font-medium text-emerald-600">{money(s.total, cur)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
