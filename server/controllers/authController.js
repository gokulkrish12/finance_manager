import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { seedDefaultCategories } from '../utils/defaultCategories.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  currency: u.currency,
  locale: u.locale,
  notificationPrefs: u.notificationPrefs,
  mfaEnabled: u.mfaEnabled,
});

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, currency } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, currency: currency || 'USD' });
  await seedDefaultCategories(user._id);

  res.status(201).json({ token: generateToken(user._id), user: publicUser(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password, mfaToken } = req.body;

  const user = await User.findOne({ email }).select('+password +mfaSecret');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // If MFA is on, require a valid 6-digit TOTP code
  if (user.mfaEnabled) {
    if (!mfaToken) {
      return res.status(206).json({ mfaRequired: true, message: 'MFA code required' });
    }
    const ok = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaToken,
      window: 1,
    });
    if (!ok) {
      res.status(401);
      throw new Error('Invalid MFA code');
    }
  }

  res.json({ token: generateToken(user._id), user: publicUser(user) });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, currency, locale, notificationPrefs } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (currency !== undefined) user.currency = currency;
  if (locale !== undefined) user.locale = locale;
  if (notificationPrefs !== undefined) {
    user.notificationPrefs = { ...user.notificationPrefs.toObject?.() ?? user.notificationPrefs, ...notificationPrefs };
  }

  await user.save();
  res.json({ user: publicUser(user) });
});

// PUT /api/auth/password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

// POST /api/auth/mfa/setup — returns a QR code + secret to add to an authenticator app
export const setupMfa = asyncHandler(async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `${process.env.APP_NAME || 'PFM'} (${req.user.email})`,
  });

  // Stash the (unconfirmed) secret; only flip mfaEnabled after verify
  const user = await User.findById(req.user._id).select('+mfaSecret');
  user.mfaSecret = secret.base32;
  await user.save();

  const qr = await qrcode.toDataURL(secret.otpauth_url);
  res.json({ secret: secret.base32, qr });
});

// POST /api/auth/mfa/verify — confirm setup with a code, enabling MFA
export const verifyMfa = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id).select('+mfaSecret');

  if (!user.mfaSecret) {
    res.status(400);
    throw new Error('Start MFA setup first');
  }

  const ok = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 1,
  });
  if (!ok) {
    res.status(400);
    throw new Error('Invalid code — try again');
  }

  user.mfaEnabled = true;
  await user.save();
  res.json({ message: 'Two-factor authentication enabled', mfaEnabled: true });
});

// POST /api/auth/mfa/disable
export const disableMfa = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Password is incorrect');
  }
  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  await user.save();
  res.json({ message: 'Two-factor authentication disabled', mfaEnabled: false });
});
