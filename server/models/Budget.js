import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    limit: { type: Number, required: [true, 'Budget limit is required'], min: [0, 'Limit must be positive'] },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    // Alert threshold as a fraction of the limit (0.8 = warn at 80%)
    alertThreshold: { type: Number, default: 0.8, min: 0, max: 1 },
  },
  { timestamps: true }
);

// One budget per category+period per user
budgetSchema.index({ user: 1, category: 1, period: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
