import Goal from '../models/Goal.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const withProgress = (g) => {
  const obj = g.toObject ? g.toObject() : g;
  const pct = obj.targetAmount > 0 ? Math.min(100, (obj.currentAmount / obj.targetAmount) * 100) : 0;
  const msLeft = new Date(obj.deadline).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, obj.targetAmount - obj.currentAmount);
  // Suggested monthly saving to hit the goal on time
  const monthsLeft = Math.max(1, daysLeft / 30);
  return {
    ...obj,
    progress: Math.round(pct * 10) / 10,
    remaining,
    daysLeft,
    suggestedMonthly: Math.ceil(remaining / monthsLeft),
    onTrack: daysLeft > 0 || obj.status === 'completed',
  };
};

// GET /api/goals
export const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(goals.map(withProgress));
});

// POST /api/goals
export const createGoal = asyncHandler(async (req, res) => {
  const { title, targetAmount, currentAmount, deadline, description } = req.body;
  const goal = await Goal.create({
    user: req.user._id,
    title,
    targetAmount,
    currentAmount: currentAmount || 0,
    deadline,
    description,
  });
  res.status(201).json(withProgress(goal));
});

// PUT /api/goals/:id
export const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  const { title, targetAmount, currentAmount, deadline, description, status } = req.body;
  if (title !== undefined) goal.title = title;
  if (targetAmount !== undefined) goal.targetAmount = targetAmount;
  if (currentAmount !== undefined) goal.currentAmount = currentAmount;
  if (deadline !== undefined) goal.deadline = deadline;
  if (description !== undefined) goal.description = description;
  if (status !== undefined) goal.status = status;
  await goal.save();
  res.json(withProgress(goal));
});

// POST /api/goals/:id/contribute — add money towards a goal
export const contribute = asyncHandler(async (req, res) => {
  const { amount, note } = req.body;
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Contribution amount must be positive');
  }
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  goal.currentAmount += amount;
  goal.contributions.push({ amount, note: note || '' });
  await goal.save();
  res.json(withProgress(goal));
});

// DELETE /api/goals/:id
export const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }
  res.json({ message: 'Goal deleted' });
});
