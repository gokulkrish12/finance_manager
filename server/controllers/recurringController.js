import RecurringExpense from '../models/RecurringExpense.js';
import Category from '../models/Category.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { processDueRecurring } from '../utils/recurring.js';

// GET /api/recurring
export const getRecurring = asyncHandler(async (req, res) => {
  const items = await RecurringExpense.find({ user: req.user._id })
    .sort({ nextRun: 1 })
    .populate('category', 'name icon color');
  res.json(items);
});

// POST /api/recurring
export const createRecurring = asyncHandler(async (req, res) => {
  const { amount, category, description, frequency, startDate, endDate } = req.body;
  const cat = await Category.findOne({ _id: category, user: req.user._id });
  if (!cat) {
    res.status(400);
    throw new Error('Invalid category');
  }
  const start = startDate ? new Date(startDate) : new Date();
  const rule = await RecurringExpense.create({
    user: req.user._id,
    amount,
    category: cat._id,
    categoryName: cat.name,
    description,
    frequency: frequency || 'monthly',
    startDate: start,
    endDate: endDate || null,
    nextRun: start, // first occurrence fires on/after start date
  });
  res.status(201).json(rule);
});

// PUT /api/recurring/:id
export const updateRecurring = asyncHandler(async (req, res) => {
  const rule = await RecurringExpense.findOne({ _id: req.params.id, user: req.user._id });
  if (!rule) {
    res.status(404);
    throw new Error('Recurring expense not found');
  }
  const { amount, description, frequency, endDate, active } = req.body;
  if (amount !== undefined) rule.amount = amount;
  if (description !== undefined) rule.description = description;
  if (frequency !== undefined) rule.frequency = frequency;
  if (endDate !== undefined) rule.endDate = endDate;
  if (active !== undefined) rule.active = active;
  await rule.save();
  res.json(rule);
});

// DELETE /api/recurring/:id
export const deleteRecurring = asyncHandler(async (req, res) => {
  const rule = await RecurringExpense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!rule) {
    res.status(404);
    throw new Error('Recurring expense not found');
  }
  res.json({ message: 'Recurring expense deleted' });
});

// POST /api/recurring/run — manually trigger due-processing (useful for demos/tests)
export const runRecurring = asyncHandler(async (req, res) => {
  const created = await processDueRecurring();
  res.json({ message: `Processed recurring expenses`, created });
});
