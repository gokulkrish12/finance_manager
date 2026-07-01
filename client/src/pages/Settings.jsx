import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CURRENCIES } from '../utils/format.js';
import { Modal, Spinner, PasswordInput } from '../components/ui.jsx';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    currency: user?.currency || 'USD',
    notificationPrefs: user?.notificationPrefs || { budgetAlerts: true, billReminders: true, goalUpdates: true },
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  // MFA
  const [mfaModal, setMfaModal] = useState(false);
  const [mfaData, setMfaData] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [disableModal, setDisableModal] = useState(false);
  const [disablePw, setDisablePw] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profile);
      updateUser(res.data.user);
      toast.success('Profile saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save'); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await api.put('/auth/password', pw);
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Could not change password'); }
    finally { setSavingPw(false); }
  };

  const startMfa = async () => {
    try {
      const res = await api.post('/auth/mfa/setup');
      setMfaData(res.data);
      setMfaCode('');
      setMfaModal(true);
    } catch { toast.error('Could not start MFA setup'); }
  };

  const verifyMfa = async (e) => {
    e.preventDefault();
    setMfaBusy(true);
    try {
      await api.post('/auth/mfa/verify', { token: mfaCode });
      updateUser({ mfaEnabled: true });
      setMfaModal(false);
      toast.success('Two-factor authentication enabled 🔐');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid code'); }
    finally { setMfaBusy(false); }
  };

  const disableMfa = async (e) => {
    e.preventDefault();
    setMfaBusy(true);
    try {
      await api.post('/auth/mfa/disable', { password: disablePw });
      updateUser({ mfaEnabled: false });
      setDisableModal(false);
      setDisablePw('');
      toast.success('Two-factor authentication disabled');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not disable'); }
    finally { setMfaBusy(false); }
  };

  const Toggle = ({ label, desc, checked, onChange }) => (
    <label className="flex cursor-pointer items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile, preferences, and security.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile */}
        <form onSubmit={saveProfile} className="card space-y-4">
          <h3 className="font-semibold text-slate-700">Profile</h3>
          <div>
            <label className="label">Name</label>
            <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-slate-50" value={user?.email} disabled />
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input" value={profile.currency} onChange={(e) => setProfile({ ...profile, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>{savingProfile ? <Spinner className="h-4 w-4 text-white" /> : 'Save profile'}</button>
        </form>

        {/* Notifications */}
        <form onSubmit={saveProfile} className="card">
          <h3 className="font-semibold text-slate-700">Notifications</h3>
          <div className="mt-2 divide-y divide-slate-100">
            <Toggle label="Budget alerts" desc="Warn me when I approach a limit"
              checked={profile.notificationPrefs.budgetAlerts}
              onChange={(v) => setProfile({ ...profile, notificationPrefs: { ...profile.notificationPrefs, budgetAlerts: v } })} />
            <Toggle label="Bill reminders" desc="Remind me about recurring expenses"
              checked={profile.notificationPrefs.billReminders}
              onChange={(v) => setProfile({ ...profile, notificationPrefs: { ...profile.notificationPrefs, billReminders: v } })} />
            <Toggle label="Goal updates" desc="Notify me on goal progress"
              checked={profile.notificationPrefs.goalUpdates}
              onChange={(v) => setProfile({ ...profile, notificationPrefs: { ...profile.notificationPrefs, goalUpdates: v } })} />
          </div>
          <button type="submit" className="btn-primary mt-4" disabled={savingProfile}>Save preferences</button>
        </form>

        {/* Password */}
        <form onSubmit={savePassword} className="card space-y-4">
          <h3 className="font-semibold text-slate-700">Change password</h3>
          <div>
            <label className="label">Current password</label>
            <PasswordInput required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New password</label>
            <PasswordInput required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="At least 6 characters" />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPw}>{savingPw ? <Spinner className="h-4 w-4 text-white" /> : 'Update password'}</button>
        </form>

        {/* Security / MFA */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-slate-700">Two-factor authentication</h3>
          <p className="text-sm text-slate-500">
            Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.).
          </p>
          {user?.mfaEnabled ? (
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
              <span className="text-sm font-medium text-emerald-700">🔐 2FA is enabled</span>
              <button className="btn-danger py-1.5 text-sm" onClick={() => setDisableModal(true)}>Disable</button>
            </div>
          ) : (
            <button className="btn-primary" onClick={startMfa}>Enable 2FA</button>
          )}
          <div className="border-t border-slate-100 pt-4">
            <button className="text-sm font-medium text-red-600 hover:underline" onClick={logout}>Log out of this device</button>
          </div>
        </div>
      </div>

      {/* MFA setup modal */}
      <Modal open={mfaModal} onClose={() => setMfaModal(false)} title="Set up two-factor authentication" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">1. Scan this QR code with your authenticator app:</p>
          {mfaData?.qr && <img src={mfaData.qr} alt="MFA QR code" className="mx-auto h-44 w-44 rounded-lg ring-1 ring-slate-200" />}
          <p className="text-center text-xs text-slate-400">Or enter this key manually:<br /><code className="text-slate-600">{mfaData?.secret}</code></p>
          <form onSubmit={verifyMfa} className="space-y-3">
            <p className="text-sm text-slate-500">2. Enter the 6-digit code to confirm:</p>
            <input inputMode="numeric" maxLength={6} required className="input text-center text-lg tracking-[0.5em]"
              value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" autoFocus />
            <button type="submit" className="btn-primary w-full" disabled={mfaBusy}>{mfaBusy ? <Spinner className="h-4 w-4 text-white" /> : 'Verify & enable'}</button>
          </form>
        </div>
      </Modal>

      {/* Disable MFA modal */}
      <Modal open={disableModal} onClose={() => setDisableModal(false)} title="Disable two-factor authentication" maxWidth="max-w-sm">
        <form onSubmit={disableMfa} className="space-y-4">
          <p className="text-sm text-slate-500">Confirm your password to turn off 2FA.</p>
          <PasswordInput required value={disablePw} onChange={(e) => setDisablePw(e.target.value)} placeholder="Password" autoFocus />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setDisableModal(false)}>Cancel</button>
            <button type="submit" className="btn-danger" disabled={mfaBusy}>{mfaBusy ? <Spinner className="h-4 w-4" /> : 'Disable 2FA'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
