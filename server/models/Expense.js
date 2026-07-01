import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount must be positive'] },
    // Store both the category ref and a denormalized name so reports survive category deletion
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now, index: true },
    // Set when the expense was auto-created from a recurring rule
    recurring: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringExpense', default: null },
  },
  { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1 });

export default mongoose.model('Expense', expenseSchema);
