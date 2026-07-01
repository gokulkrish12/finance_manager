import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password by default
    },

    // Preferences
    currency: { type: String, default: 'USD' }, // ISO 4217 code
    locale: { type: String, default: 'en-US' },
    notificationPrefs: {
      budgetAlerts: { type: Boolean, default: true },
      billReminders: { type: Boolean, default: true },
      goalUpdates: { type: Boolean, default: true },
    },

    // Multi-factor auth (TOTP)
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
  },
  { timestamps: true }
);

// Hash password before save whenever it changes
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
