import Expense from '../models/Expense.js';
import Category from '../models/Category.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { resolveDateRange } from '../utils/dateRange.js';

/**
 * Build the Mongo filter shared by list/summary endpoints.
 */
const buildFilter = (req) => {
  const filter = { user: req.user._id };
  const { category, start, end, period, search } = req.query;
  if (category) filter.category = category;
  const range = resolveDateRange({ start, end, period });
  if (Object.keys(range).length) filter.date = range;
  if (search) filter.description = { $regex: search, $options: 'i' };
  return filter;
};

// GET /api/expenses
export const getExpenses = asyncHandler(async (req, res) => {
  const filter = buildFilter(req);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name icon color'),
    Expense.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/expenses/:id
export const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }
  res.json(expense);
});

// POST /api/expenses
export const createExpense = asyncHandler(async (req, res) => {
  const { amount, category, description, date } = req.body;

  const cat = await Category.findOne({ _id: category, user: req.user._id });
  if (!cat) {
    res.status(400);
    throw new Error('Invalid category');
  }

  const expense = await Expense.create({
    user: req.user._id,
    amount,
    category: cat._id,
    categoryName: cat.name,
    description,
    date: date || Date.now(),
  });
  res.status(201).json(expense);
});

// PUT /api/expenses/:id
export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  const { amount, category, description, date } = req.body;
  if (category && category !== String(expense.category)) {
    const cat = await Category.findOne({ _id: category, user: req.user._id });
    if (!cat) {
      res.status(400);
      throw new Error('Invalid category');
    }
    expense.category = cat._id;
    expense.categoryName = cat.name;
  }
  if (amount !== undefined) expense.amount = amount;
  if (description !== undefined) expense.description = description;
  if (date !== undefined) expense.date = date;

  await expense.save();
  res.json(expense);
});

// DELETE /api/expenses/:id
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }
  res.json({ message: 'Expense deleted' });
});

// GET /api/expenses/summary/by-category — for pie/doughnut charts
export const summaryByCategory = asyncHandler(async (req, res) => {
  const filter = buildFilter(req);
  const data = await Expense.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$category',
        categoryName: { $first: '$categoryName' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Attach colors from the category docs
  const cats = await Category.find({ user: req.user._id }).select('name color icon');
  const colorMap = Object.fromEntries(cats.map((c) => [String(c._id), { color: c.color, icon: c.icon }]));

  res.json(
    data.map((d) => ({
      categoryId: d._id,
      categoryName: d.categoryName,
      total: d.total,
      count: d.count,
      color: colorMap[String(d._id)]?.color || '#64748b',
      icon: colorMap[String(d._id)]?.icon || '💸',
    }))
  );
});

// GET /api/expenses/summary/trend?months=6 — monthly totals for a line/bar chart
export const summaryTrend = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, parseInt(req.query.months) || 6));
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const data = await Expense.aggregate([
    { $match: { user: req.user._id, date: { $gte: startDate } } },
    {
      $group: {
        _id: { y: { $year: '$date' }, m: { $month: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  // Fill in gaps so the chart shows every month, even zero-spend ones
  const map = Object.fromEntries(data.map((d) => [`${d._id.y}-${d._id.m}`, d.total]));
  const series = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    series.push({
      label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      total: map[key] || 0,
    });
  }
  res.json(series);
});
