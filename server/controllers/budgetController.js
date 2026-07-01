import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import Expense from '../models/Expense.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { periodStart } from '../utils/dateRange.js';

/**
 * Compute how much has been spent for each budget in the current period,
 * and derive status (ok / warning / exceeded).
 */
const attachUsage = async (budgets, userId) => {
  const results = [];
  for (const b of budgets) {
    // b.category may be a populated document; always match on the raw ObjectId.
    const categoryId = b.category?._id || b.category;
    const spentAgg = await Expense.aggregate([
      {
        $match: {
          user: userId,
          category: categoryId,
          date: { $gte: periodStart(b.period) },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const spent = spentAgg[0]?.total || 0;
    const ratio = b.limit > 0 ? spent / b.limit : 0;
    let status = 'ok';
    if (ratio >= 1) status = 'exceeded';
    else if (ratio >= b.alertThreshold) status = 'warning';

    results.push({
      ...b.toObject(),
      spent,
      remaining: Math.max(0, b.limit - spent),
      ratio: Math.round(ratio * 100) / 100,
      status,
    });
  }
  return results;
};

// GET /api/budgets
export const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ user: req.user._id }).populate('category', 'name icon color');
  const withUsage = await attachUsage(budgets, req.user._id);
  res.json(withUsage);
});

// POST /api/budgets
export const createBudget = asyncHandler(async (req, res) => {
  const { category, limit, period, alertThreshold } = req.body;
  const cat = await Category.findOne({ _id: category, user: req.user._id });
  if (!cat) {
    res.status(400);
    throw new Error('Invalid category');
  }
  const budget = await Budget.create({
    user: req.user._id,
    category: cat._id,
    categoryName: cat.name,
    limit,
    period: period || 'monthly',
    alertThreshold: alertThreshold ?? 0.8,
  });
  const [withUsage] = await attachUsage([budget], req.user._id);
  res.status(201).json(withUsage);
});

// PUT /api/budgets/:id
export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }
  const { limit, period, alertThreshold } = req.body;
  if (limit !== undefined) budget.limit = limit;
  if (period !== undefined) budget.period = period;
  if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
  await budget.save();
  const [withUsage] = await attachUsage([budget], req.user._id);
  res.json(withUsage);
});

// DELETE /api/budgets/:id
export const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }
  res.json({ message: 'Budget deleted' });
});

// GET /api/budgets/alerts — budgets at/over their alert threshold (for notifications)
export const getBudgetAlerts = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ user: req.user._id }).populate('category', 'name icon color');
  const withUsage = await attachUsage(budgets, req.user._id);
  res.json(withUsage.filter((b) => b.status !== 'ok'));
});
