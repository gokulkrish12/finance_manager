import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money, fmtDate, fmtDateInput } from '../utils/format.js';
import { Modal, ConfirmDialog, Spinner, EmptyState, PageLoader, StatCard } from '../components/ui.jsx';

const emptyForm = { amount: '', source: '', description: '', date: fmtDateInput(new Date()) };

export default function Income() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';

  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [bySource, setBySource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        api.get('/income', { params: { period, page } }),
        api.get('/income/summary/by-source', { params: { period } }),
      ]);
      setData(list.data);
      setBySource(sum.data);
    } finally {
      setLoading(false);
    }
  }, [period, page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (i) => {
    setEditing(i);
    setForm({ amount: i.amount, source: i.source, description: i.description, date: fmtDateInput(i.date) });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) { await api.put(`/income/${editing._id}`, payload); toast.success('Income updated'); }
      else { await api.post('/income', payload); toast.success('Income added'); }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/income/${toDelete._id}`);
      toast.success('Income deleted');
      setToDelete(null);
      load();
    } catch { toast.error('Could not delete'); }
    finally { setDeleting(false); }
  };

  const total = bySource.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Income</h1>
          <p className="text-sm text-slate-500">Track your earnings from every source.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add income</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={`Total (${period})`} value={money(total, cur)} icon="💰" accent="green" />
        <StatCard label="Sources" value={bySource.length} icon="🔀" accent="brand" />
        <div className="card flex items-center">
          <div className="w-full">
            <label className="label">Period</label>
            <select className="input" value={period} onChange={(e) => { setPeriod(e.target.value); setPage(1); }}>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold text-slate-700">Income entries</h3>
        {loading ? <PageLoader /> : data.items.length === 0 ? (
          <EmptyState icon="💵" title="No income recorded" subtitle="Add your salary, freelance, or other income."
            action={<button className="btn-primary" onClick={openAdd}>+ Add income</button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                    <th className="py-2 pr-2 font-medium">Date</th>
                    <th className="py-2 pr-2 font-medium">Source</th>
                    <th className="py-2 pr-2 font-medium">Description</th>
                    <th className="py-2 pr-2 text-right font-medium">Amount</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.items.map((i) => (
                    <tr key={i._id} className="group hover:bg-slate-50">
                      <td className="whitespace-nowrap py-2.5 pr-2 text-slate-500">{fmtDate(i.date)}</td>
                      <td className="py-2.5 pr-2"><span className="badge bg-emerald-50 text-emerald-700">{i.source}</span></td>
                      <td className="py-2.5 pr-2 text-slate-600">{i.description || '—'}</td>
                      <td className="py-2.5 pr-2 text-right font-semibold text-emerald-600">+{money(i.amount, cur)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <button onClick={() => openEdit(i)} className="rounded p-1 text-slate-400 hover:bg-brand-50 hover:text-brand-600">✏️</button>
                          <button onClick={() => setToDelete(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button className="btn-ghost px-3 py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
                <span className="text-sm text-slate-500">Page {data.page} of {data.pages}</span>
                <button className="btn-ghost px-3 py-1" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit income' : 'Add income'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Amount ({cur})</label>
            <input type="number" step="0.01" min="0" required className="input" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" autoFocus />
          </div>
          <div>
            <label className="label">Source</label>
            <input required className="input" value={form.source} list="income-sources"
              onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. Salary" />
            <datalist id="income-sources">
              {['Salary', 'Freelance', 'Investments', 'Business', 'Gift', 'Other'].map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" required className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Description <span className="text-slate-400">(optional)</span></label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting}
        message="Delete this income entry? This can't be undone." />
    </div>
  );
}
