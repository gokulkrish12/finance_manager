import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money, fmtDate, fmtDateInput } from '../utils/format.js';
import { Modal, ConfirmDialog, Spinner, EmptyState, PageLoader } from '../components/ui.jsx';
import { CategoryDoughnut } from '../components/charts.jsx';

const emptyForm = { amount: '', category: '', description: '', date: fmtDateInput(new Date()) };

export default function Expenses() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';

  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month', category: '', search: '', page: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const [list, sum] = await Promise.all([
        api.get('/expenses', { params }),
        api.get('/expenses/summary/by-category', { params: { period: filters.period, category: filters.category } }),
      ]);
      setData(list.data);
      setSummary(sum.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    api.get('/categories', { params: { type: 'expense' } }).then((r) => setCategories(r.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, category: categories[0]?._id || '' });
    setModalOpen(true);
  };
  const openEdit = (e) => {
    setEditing(e);
    setForm({ amount: e.amount, category: e.category?._id || e.category, description: e.description, date: fmtDateInput(e.date) });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) {
        await api.put(`/expenses/${editing._id}`, payload);
        toast.success('Expense updated');
      } else {
        await api.post('/expenses', payload);
        toast.success('Expense added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save expense');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/expenses/${toDelete._id}`);
      toast.success('Expense deleted');
      setToDelete(null);
      load();
    } catch {
      toast.error('Could not delete');
    } finally {
      setDeleting(false);
    }
  };

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page || 1 }));
  const total = summary.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>
          <p className="text-sm text-slate-500">Record and review where your money goes.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add expense</button>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <label className="label">Period</label>
          <select className="input" value={filters.period} onChange={(e) => setFilter({ period: e.target.value })}>
            <option value="week">Last 7 days</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={filters.category} onChange={(e) => setFilter({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Search description</label>
          <input className="input" value={filters.search} placeholder="e.g. coffee"
            onChange={(e) => setFilter({ search: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List */}
        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Transactions</h3>
            <span className="text-sm text-slate-400">{data.total} total · {money(total, cur)}</span>
          </div>

          {loading ? <PageLoader /> : data.items.length === 0 ? (
            <EmptyState icon="🧾" title="No expenses found" subtitle="Try a different filter, or add your first expense."
              action={<button className="btn-primary" onClick={openAdd}>+ Add expense</button>} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                      <th className="py-2 pr-2 font-medium">Date</th>
                      <th className="py-2 pr-2 font-medium">Category</th>
                      <th className="py-2 pr-2 font-medium">Description</th>
                      <th className="py-2 pr-2 text-right font-medium">Amount</th>
                      <th className="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.items.map((e) => (
                      <tr key={e._id} className="group hover:bg-slate-50">
                        <td className="whitespace-nowrap py-2.5 pr-2 text-slate-500">{fmtDate(e.date)}</td>
                        <td className="py-2.5 pr-2">
                          <span className="badge bg-slate-100 text-slate-700">{e.category?.icon} {e.categoryName}</span>
                        </td>
                        <td className="py-2.5 pr-2 text-slate-600">{e.description || '—'}</td>
                        <td className="py-2.5 pr-2 text-right font-semibold text-slate-800">{money(e.amount, cur)}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                            <button onClick={() => openEdit(e)} className="rounded p-1 text-slate-400 hover:bg-brand-50 hover:text-brand-600" title="Edit">✏️</button>
                            <button onClick={() => setToDelete(e)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button className="btn-ghost px-3 py-1" disabled={data.page <= 1} onClick={() => setFilter({ page: data.page - 1 })}>Prev</button>
                  <span className="text-sm text-slate-500">Page {data.page} of {data.pages}</span>
                  <button className="btn-ghost px-3 py-1" disabled={data.page >= data.pages} onClick={() => setFilter({ page: data.page + 1 })}>Next</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Distribution */}
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-700">Distribution</h3>
          <div className="h-64">
            {summary.length ? (
              <CategoryDoughnut labels={summary.map((c) => c.categoryName)} data={summary.map((c) => c.total)} colors={summary.map((c) => c.color)} />
            ) : <EmptyState icon="🥧" title="No data" />}
          </div>
          {summary.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm">
              {summary.slice(0, 5).map((c) => (
                <li key={c.categoryId} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /> {c.categoryName}
                  </span>
                  <span className="font-medium text-slate-700">{money(c.total, cur)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit expense' : 'Add expense'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Amount ({cur})</label>
            <input type="number" step="0.01" min="0" required className="input" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" autoFocus />
          </div>
          <div>
            <label className="label">Category</label>
            <select required className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="" disabled>Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" required className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Description <span className="text-slate-400">(optional)</span></label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Weekly groceries" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting}
        message={`Delete this ${toDelete ? money(toDelete.amount, cur) : ''} expense? This can't be undone.`} />
    </div>
  );
}
