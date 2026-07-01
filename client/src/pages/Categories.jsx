import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { Modal, ConfirmDialog, Spinner, PageLoader } from '../components/ui.jsx';

const EMOJIS = ['💸', '🛒', '🏠', '💡', '🚗', '🎬', '🍽️', '🏥', '🛍️', '📚', '✈️', '🎁', '💰', '💻', '📈', '➕', '🐶', '👕', '☕', '🏋️'];
const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#64748b'];
const empty = { name: '', type: 'expense', icon: '💸', color: '#6366f1' };

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/categories').then((r) => setCats(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = (type) => { setEditing(null); setForm({ ...empty, type }); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, type: c.type, icon: c.icon, color: c.color }); setModalOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.put(`/categories/${editing._id}`, form); toast.success('Category updated'); }
      else { await api.post('/categories', form); toast.success('Category created'); }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/categories/${toDelete._id}`); toast.success('Category deleted'); setToDelete(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not delete'); }
    finally { setDeleting(false); }
  };

  const Section = ({ type, title }) => {
    const list = cats.filter((c) => c.type === type);
    return (
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">{title}</h3>
          <button className="btn-ghost py-1.5 text-sm" onClick={() => openAdd(type)}>+ Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {list.map((c) => (
            <div key={c._id} className="group flex items-center gap-2 rounded-full py-1.5 pl-3 pr-2 text-sm ring-1"
              style={{ background: `${c.color}12`, color: c.color, borderColor: `${c.color}40` }}>
              <span>{c.icon}</span>
              <span className="font-medium">{c.name}</span>
              <button onClick={() => openEdit(c)} className="ml-1 hidden text-xs opacity-60 hover:opacity-100 group-hover:inline">✏️</button>
              <button onClick={() => setToDelete(c)} className="hidden text-xs opacity-60 hover:opacity-100 group-hover:inline">✕</button>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-slate-400">No categories yet.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
        <p className="text-sm text-slate-500">Organize expenses and income your way.</p>
      </div>

      {loading ? <PageLoader /> : (
        <div className="space-y-6">
          <Section type="expense" title="Expense categories" />
          <Section type="income" title="Income categories" />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit category' : 'New category'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          {!editing && (
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          )}
          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((em) => (
                <button type="button" key={em} onClick={() => setForm({ ...form, icon: em })}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${form.icon === em ? 'ring-2 ring-brand-500 bg-brand-50' : 'hover:bg-slate-100'}`}>{em}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((col) => (
                <button type="button" key={col} onClick={() => setForm({ ...form, color: col })}
                  className={`h-8 w-8 rounded-full ${form.color === col ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} style={{ background: col }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting}
        message={`Delete category "${toDelete?.name}"? Categories in use by expenses can't be deleted.`} />
    </div>
  );
}
