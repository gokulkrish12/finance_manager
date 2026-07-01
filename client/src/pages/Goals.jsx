import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money, fmtDate, fmtDateInput, fromNow } from '../utils/format.js';
import { Modal, ConfirmDialog, Spinner, EmptyState, PageLoader, ProgressBar } from '../components/ui.jsx';

const emptyForm = { title: '', targetAmount: '', currentAmount: '', deadline: '', description: '' };

export default function Goals() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [contribGoal, setContribGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/goals').then((r) => setGoals(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (g) => {
    setEditing(g);
    setForm({ title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: fmtDateInput(g.deadline), description: g.description });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount || 0) };
      if (editing) { await api.put(`/goals/${editing._id}`, payload); toast.success('Goal updated'); }
      else { await api.post('/goals', payload); toast.success('Goal created'); }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save goal'); }
    finally { setSaving(false); }
  };

  const contribute = async (e) => {
    e.preventDefault();
    setContributing(true);
    try {
      await api.post(`/goals/${contribGoal._id}/contribute`, { amount: Number(contribAmount) });
      toast.success('Contribution added! 🎉');
      setContribGoal(null); setContribAmount('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not contribute'); }
    finally { setContributing(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/goals/${toDelete._id}`); toast.success('Goal deleted'); setToDelete(null); load(); }
    catch { toast.error('Could not delete'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Goals</h1>
          <p className="text-sm text-slate-500">Save toward what matters — and watch your progress.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ New goal</button>
      </div>

      {loading ? <PageLoader /> : goals.length === 0 ? (
        <EmptyState icon="🏆" title="No goals yet" subtitle="Set a goal like a vacation, emergency fund, or a new car."
          action={<button className="btn-primary" onClick={openAdd}>+ New goal</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const overdue = g.daysLeft < 0 && g.status !== 'completed';
            return (
              <div key={g._id} className="card flex flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{g.title}</h3>
                    <p className="text-xs text-slate-400">Target {fmtDate(g.deadline)}</p>
                  </div>
                  {g.status === 'completed'
                    ? <span className="badge bg-emerald-50 text-emerald-700">✓ Completed</span>
                    : overdue
                      ? <span className="badge bg-red-50 text-red-700">Overdue</span>
                      : <span className="badge bg-brand-50 text-brand-700">{g.daysLeft}d left</span>}
                </div>

                {g.description && <p className="mt-2 text-sm text-slate-500">{g.description}</p>}

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">{money(g.currentAmount, cur)}</span>
                    <span className="text-slate-400">of {money(g.targetAmount, cur)}</span>
                  </div>
                  <ProgressBar value={g.progress} max={100} color={g.status === 'completed' ? 'bg-emerald-500' : undefined} />
                  <div className="mt-1.5 flex justify-between text-xs text-slate-400">
                    <span>{g.progress}% saved</span>
                    {g.status !== 'completed' && <span>Save {money(g.suggestedMonthly, cur)}/mo to hit target</span>}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {g.status !== 'completed' && (
                    <button className="btn-primary flex-1 py-1.5" onClick={() => { setContribGoal(g); setContribAmount(''); }}>+ Contribute</button>
                  )}
                  <button className="btn-ghost py-1.5" onClick={() => openEdit(g)}>Edit</button>
                  <button className="btn-ghost py-1.5 px-2.5 text-red-500" onClick={() => setToDelete(g)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / edit */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit goal' : 'New goal'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Goal title</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Emergency fund" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target ({cur})</label>
              <input type="number" step="0.01" min="0" required className="input" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
            </div>
            <div>
              <label className="label">Saved so far</label>
              <input type="number" step="0.01" min="0" className="input" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" required className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
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

      {/* Contribute */}
      <Modal open={!!contribGoal} onClose={() => setContribGoal(null)} title={`Contribute to "${contribGoal?.title}"`} maxWidth="max-w-sm">
        <form onSubmit={contribute} className="space-y-4">
          <p className="text-sm text-slate-500">
            {money(contribGoal?.currentAmount || 0, cur)} of {money(contribGoal?.targetAmount || 0, cur)} saved
            {contribGoal && contribGoal.remaining > 0 && ` · ${money(contribGoal.remaining, cur)} to go`}
          </p>
          <div>
            <label className="label">Amount ({cur})</label>
            <input type="number" step="0.01" min="0" required className="input" value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)} placeholder="0.00" autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setContribGoal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={contributing}>{contributing ? <Spinner className="h-4 w-4 text-white" /> : 'Add contribution'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting}
        message={`Delete goal "${toDelete?.title}"? This can't be undone.`} />
    </div>
  );
}
