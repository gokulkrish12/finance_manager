import Income from '../models/Income.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { resolveDateRange } from '../utils/dateRange.js';

const buildFilter = (req) => {
  const filter = { user: req.user._id };
  const { start, end, period, source } = req.query;
  if (source) filter.source = { $regex: source, $options: 'i' };
  const range = resolveDateRange({ start, end, period });
  if (Object.keys(range).length) filter.date = range;
  return filter;
};

// GET /api/income
export const getIncome = asyncHandler(async (req, res) => {
  const filter = buildFilter(req);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);

  const [items, total] = await Promise.all([
    Income.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
    Income.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// POST /api/income
export const createIncome = asyncHandler(async (req, res) => {
  const { amount, source, description, date } = req.body;
  const income = await Income.create({
    user: req.user._id,
    amount,
    source,
    description,
    date: date || Date.now(),
  });
  res.status(201).json(income);
});

// PUT /api/income/:id
export const updateIncome = asyncHandler(async (req, res) => {
  const income = await Income.findOne({ _id: req.params.id, user: req.user._id });
  if (!income) {
    res.status(404);
    throw new Error('Income not found');
  }
  const { amount, source, description, date } = req.body;
  if (amount !== undefined) income.amount = amount;
  if (source !== undefined) income.source = source;
  if (description !== undefined) income.description = description;
  if (date !== undefined) income.date = date;
  await income.save();
  res.json(income);
});

// DELETE /api/income/:id
export const deleteIncome = asyncHandler(async (req, res) => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!income) {
    res.status(404);
    throw new Error('Income not found');
  }
  res.json({ message: 'Income deleted' });
});

// GET /api/income/summary/by-source
export const summaryBySource = asyncHandler(async (req, res) => {
  const filter = buildFilter(req);
  const data = await Income.aggregate([
    { $match: filter },
    { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  res.json(data.map((d) => ({ source: d._id, total: d.total, count: d.count })));
});
