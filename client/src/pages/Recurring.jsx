import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money, fmtDate, fmtDateInput } from '../utils/format.js';
import { Modal, ConfirmDialog, Spinner, EmptyState, PageLoader } from '../components/ui.jsx';

const emptyForm = { amount: '', category: '', description: '', frequency: 'monthly', startDate: fmtDateInput(new Date()), endDate: '' };

export default function Recurring() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/recurring'), api.get('/categories', { params: { type: 'expense' } })])
      .then(([r, c]) => { setItems(r.data); setCategories(c.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, category: categories[0]?._id || '' }); setModalOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ amount: r.amount, category: r.category?._id || r.category, description: r.description, frequency: r.frequency, startDate: fmtDateInput(r.startDate), endDate: r.endDate ? fmtDateInput(r.endDate) : '' });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), endDate: form.endDate || null };
      if (editing) { await api.put(`/recurring/${editing._id}`, payload); toast.success('Recurring expense updated'); }
      else { await api.post('/recurring', payload); toast.success('Recurring expense created'); }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (r) => {
    try { await api.put(`/recurring/${r._id}`, { active: !r.active }); load(); }
    catch { toast.error('Could not update'); }
  };

  const runNow = async () => {
    try { const res = await api.post('/recurring/run'); toast.success(`Processed — ${res.data.created} expense(s) created`); load(); }
    catch { toast.error('Could not run'); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/recurring/${toDelete._id}`); toast.success('Deleted'); setToDelete(null); load(); }
    catch { toast.error('Could not delete'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recurring Expenses</h1>
          <p className="text-sm text-slate-500">Subscriptions, rent, bills — logged automatically.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={runNow} title="Process any due expenses now">⚡ Run due</button>
          <button className="btn-primary" onClick={openAdd} disabled={categories.length === 0}>+ New recurring</button>
        </div>
      </div>

      {loading ? <PageLoader /> : items.length === 0 ? (
        <EmptyState icon="🔁" title="No recurring expenses" subtitle="Set up subscriptions or bills and they'll be added on schedule."
          action={<button className="btn-primary" onClick={openAdd}>+ New recurring</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                <th className="py-2 pr-2 font-medium">Description</th>
                <th className="py-2 pr-2 font-medium">Category</th>
                <th className="py-2 pr-2 font-medium">Frequency</th>
                <th className="py-2 pr-2 font-medium">Next run</th>
                <th className="py-2 pr-2 text-right font-medium">Amount</th>
                <th className="py-2 pr-2 font-medium">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((r) => (
                <tr key={r._id} className="group hover:bg-slate-50">
                  <td className="py-2.5 pr-2 font-medium text-slate-700">{r.description || r.categoryName}</td>
                  <td className="py-2.5 pr-2"><span className="badge bg-slate-100 text-slate-700">{r.category?.icon} {r.categoryName}</span></td>
                  <td className="py-2.5 pr-2 capitalize text-slate-500">{r.frequency}</td>
                  <td className="py-2.5 pr-2 text-slate-500">{fmtDate(r.nextRun)}</td>
                  <td className="py-2.5 pr-2 text-right font-semibold text-slate-800">{money(r.amount, cur)}</td>
                  <td className="py-2.5 pr-2">
                    <button onClick={() => toggleActive(r)} className={`badge ${r.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {r.active ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(r)} className="rounded p-1 text-slate-400 hover:bg-brand-50 hover:text-brand-600">✏️</button>
                      <button onClick={() => setToDelete(r)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit recurring expense' : 'New recurring expense'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Netflix, Rent" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount ({cur})</label>
              <input type="number" step="0.01" min="0" required className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select required className="input" value={form.category} disabled={!!editing} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="" disabled>Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start date</label>
              <input type="date" required className="input" value={form.startDate} disabled={!!editing} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">End date <span className="text-slate-400">(optional)</span></label>
              <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting}
        message="Delete this recurring expense? Already-logged expenses will remain." />
    </div>
  );
}
