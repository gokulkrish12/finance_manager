import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Goal title is required'], trim: true },
    targetAmount: { type: Number, required: true, min: [0, 'Target must be positive'] },
    currentAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, required: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
    // History of contributions towards the goal
    contributions: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

// Auto-flip status to completed when target is reached
goalSchema.pre('save', function (next) {
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
  }
  next();
});

export default mongoose.model('Goal', goalSchema);
