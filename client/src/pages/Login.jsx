import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/ui.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', mfaToken: '' });
  const [mfaStep, setMfaStep] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form.email, form.password, form.mfaToken || undefined);
      if (res.mfaRequired) {
        setMfaStep(true);
        toast('Enter the 6-digit code from your authenticator app', { icon: '🔐' });
      } else {
        toast.success('Welcome back!');
        navigate(location.state?.from?.pathname || '/', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold text-slate-800">Sign in</h2>
      <p className="mt-1 text-sm text-slate-500">Welcome back — let's check your finances.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" required className="input" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" required className="input" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </div>
        {mfaStep && (
          <div className="animate-fade-in">
            <label className="label">Authentication code</label>
            <input inputMode="numeric" maxLength={6} className="input tracking-[0.5em] text-center text-lg"
              value={form.mfaToken} onChange={(e) => setForm({ ...form, mfaToken: e.target.value.replace(/\D/g, '') })}
              placeholder="000000" autoFocus />
          </div>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4 text-white" /> : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create one</Link>
      </p>
    </AuthShell>
  );
}
