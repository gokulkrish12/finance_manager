import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money } from '../utils/format.js';
import { Modal, ConfirmDialog, Spinner, EmptyState, PageLoader, ProgressBar } from '../components/ui.jsx';

export default function Budgets() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: '', limit: '', period: 'monthly', alertThreshold: 0.8 });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/budgets'), api.get('/categories', { params: { type: 'expense' } })])
      .then(([b, c]) => { setBudgets(b.data); setCategories(c.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm({ category: categories[0]?._id || '', limit: '', period: 'monthly', alertThreshold: 0.8 }); setModalOpen(true); };
  const openEdit = (b) => { setEditing(b); setForm({ category: b.category?._id || b.category, limit: b.limit, period: b.period, alertThreshold: b.alertThreshold }); setModalOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, limit: Number(form.limit), alertThreshold: Number(form.alertThreshold) };
      if (editing) { await api.put(`/budgets/${editing._id}`, payload); toast.success('Budget updated'); }
      else { await api.post('/budgets', payload); toast.success('Budget created'); }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save budget');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/budgets/${toDelete._id}`); toast.success('Budget deleted'); setToDelete(null); load(); }
    catch { toast.error('Could not delete'); }
    finally { setDeleting(false); }
  };

  const statusBadge = (s) => ({
    ok: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    exceeded: 'bg-red-50 text-red-700',
  }[s]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Budgets</h1>
          <p className="text-sm text-slate-500">Set spending limits and track them in real time.</p>
        </div>
        <button className="btn-primary" onClick={openAdd} disabled={categories.length === 0}>+ New budget</button>
      </div>

      {loading ? <PageLoader /> : budgets.length === 0 ? (
        <EmptyState icon="🎯" title="No budgets yet" subtitle="Create a budget to keep your spending in check."
          action={<button className="btn-primary" onClick={openAdd}>+ New budget</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((b) => (
            <div key={b._id} className="card group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{b.category?.icon || '💸'}</span>
                    <h3 className="font-semibold text-slate-800">{b.categoryName}</h3>
                  </div>
                  <span className="text-xs capitalize text-slate-400">{b.period}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`badge ${statusBadge(b.status)}`}>
                    {b.status === 'ok' ? 'On track' : b.status === 'warning' ? 'Near limit' : 'Over budget'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">{money(b.spent, cur)}</span>
                  <span className="text-slate-400">of {money(b.limit, cur)}</span>
                </div>
                <ProgressBar value={b.spent} max={b.limit} />
                <p className="mt-1.5 text-xs text-slate-400">
                  {b.remaining > 0 ? `${money(b.remaining, cur)} remaining` : `${money(b.spent - b.limit, cur)} over`} · {Math.round(b.ratio * 100)}% used
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => openEdit(b)} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-brand-50 hover:text-brand-600">Edit</button>
                <button onClick={() => setToDelete(b)} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit budget' : 'New budget'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select required className="input" value={form.category} disabled={!!editing}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="" disabled>Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Limit ({cur})</label>
              <input type="number" step="0.01" min="0" required className="input" value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Period</label>
              <select className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Alert me at {Math.round(form.alertThreshold * 100)}% of limit</label>
            <input type="range" min="0.5" max="1" step="0.05" className="w-full accent-brand-600" value={form.alertThreshold}
              onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting}
        message={`Delete the ${toDelete?.categoryName} budget?`} />
    </div>
  );
}
