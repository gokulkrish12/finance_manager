import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['expense', 'income'], default: 'expense' },
    icon: { type: String, default: '💸' }, // emoji or icon key
    color: { type: String, default: '#6366f1' }, // hex used by charts
    isDefault: { type: Boolean, default: false }, // seeded categories
  },
  { timestamps: true }
);

// A user can't have two categories with the same name + type
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
