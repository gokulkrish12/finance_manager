import mongoose from 'mongoose';

const recurringSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    description: { type: String, trim: true, default: '' }, // e.g. "Netflix", "Rent"
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null }, // null = indefinite
    // Bookkeeping for the cron job
    nextRun: { type: Date, required: true },
    lastRun: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

recurringSchema.index({ active: 1, nextRun: 1 });

export default mongoose.model('RecurringExpense', recurringSchema);
