import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount must be positive'] },
    source: { type: String, required: [true, 'Source is required'], trim: true }, // e.g. Salary, Freelance
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true }
);

incomeSchema.index({ user: 1, date: -1 });

export default mongoose.model('Income', incomeSchema);
