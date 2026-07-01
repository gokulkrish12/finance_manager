import { useEffect, useState } from 'react';

// ─── Password input with show/hide toggle ────────────────
export const PasswordInput = ({ className = '', ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} className={`input pr-10 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
      >
        {show ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
};

// ─── Spinner ──────────────────────────────────────────────
export const Spinner = ({ className = 'h-5 w-5' }) => (
  <svg className={`animate-spin text-brand-600 ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

export const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <Spinner className="h-8 w-8" />
  </div>
);

// ─── Empty state ──────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
    <div className="text-5xl">{icon}</div>
    <h3 className="mt-3 text-base font-semibold text-slate-700">{title}</h3>
    {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-400">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── Modal ────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`w-full ${maxWidth} animate-fade-in rounded-t-2xl bg-white shadow-xl sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

// ─── Confirm dialog ───────────────────────────────────────
export const ConfirmDialog = ({ open, onCancel, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Delete', loading }) => (
  <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-sm">
    <p className="text-sm text-slate-500">{message}</p>
    <div className="mt-6 flex justify-end gap-2">
      <button className="btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
      <button className="btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? <Spinner className="h-4 w-4" /> : confirmLabel}
      </button>
    </div>
  </Modal>
);

// ─── Progress bar ─────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, color }) => {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const barColor = color || (pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-brand-500');
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon, accent = 'brand' }) => {
  const accents = {
    brand: 'from-brand-500 to-brand-600',
    green: 'from-emerald-500 to-emerald-600',
    red: 'from-rose-500 to-rose-600',
    amber: 'from-amber-500 to-amber-600',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl text-white ${accents[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-xl font-bold text-slate-800">{value}</p>
        {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
};
