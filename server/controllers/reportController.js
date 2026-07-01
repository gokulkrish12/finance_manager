import Expense from '../models/Expense.js';
import Income from '../models/Income.js';
import Budget from '../models/Budget.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { resolveDateRange, periodStart } from '../utils/dateRange.js';
import { toCSV, renderPDF, buildReportDoc, money } from '../utils/export.js';

const fmtDate = (d) => new Date(d).toISOString().slice(0, 10);

/**
 * Gather the rows for an expense report given query filters.
 */
const gatherExpenses = async (req) => {
  const filter = { user: req.user._id };
  const range = resolveDateRange(req.query);
  if (Object.keys(range).length) filter.date = range;
  if (req.query.category) filter.category = req.query.category;
  return Expense.find(filter).sort({ date: -1 });
};

// GET /api/reports/expenses — JSON report (breakdown + rows)
export const expenseReport = asyncHandler(async (req, res) => {
  const rows = await gatherExpenses(req);
  const total = rows.reduce((s, e) => s + e.amount, 0);

  const byCategory = {};
  for (const e of rows) {
    byCategory[e.categoryName] = (byCategory[e.categoryName] || 0) + e.amount;
  }

  res.json({
    total,
    count: rows.length,
    byCategory: Object.entries(byCategory)
      .map(([name, amount]) => ({ name, amount, pct: total ? Math.round((amount / total) * 1000) / 10 : 0 }))
      .sort((a, b) => b.amount - a.amount),
    items: rows,
  });
});

// GET /api/reports/expenses/export?format=csv|pdf
export const exportExpenses = asyncHandler(async (req, res) => {
  const rows = await gatherExpenses(req);
  const format = (req.query.format || 'csv').toLowerCase();
  const currency = req.user.currency || 'USD';

  if (format === 'csv') {
    const data = rows.map((e) => ({
      Date: fmtDate(e.date),
      Category: e.categoryName,
      Description: e.description || '',
      Amount: e.amount,
    }));
    const csv = toCSV(data, ['Date', 'Category', 'Description', 'Amount']);
    res.header('Content-Type', 'text/csv');
    res.attachment('expense-report.csv');
    return res.send(csv);
  }

  // PDF
  const total = rows.reduce((s, e) => s + e.amount, 0);
  const doc = buildReportDoc({
    title: 'Expense Report',
    subtitle: `Generated ${fmtDate(new Date())} · ${rows.length} transactions`,
    summary: [['Total Spent', money(total, currency)], ['Transactions', String(rows.length)]],
    table: {
      widths: ['auto', '*', '*', 'auto'],
      headers: ['Date', 'Category', 'Description', 'Amount'],
      rows: rows.map((e) => [
        fmtDate(e.date),
        e.categoryName,
        e.description || '—',
        { text: money(e.amount, currency), alignment: 'right' },
      ]),
    },
  });
  const buffer = await renderPDF(doc);
  res.header('Content-Type', 'application/pdf');
  res.attachment('expense-report.pdf');
  res.send(buffer);
});

// GET /api/reports/budget — spend vs budgeted with variance
export const budgetReport = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ user: req.user._id });
  const rows = [];
  for (const b of budgets) {
    const agg = await Expense.aggregate([
      { $match: { user: req.user._id, category: b.category, date: { $gte: periodStart(b.period) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const spent = agg[0]?.total || 0;
    rows.push({
      category: b.categoryName,
      period: b.period,
      limit: b.limit,
      spent,
      variance: b.limit - spent,
      pct: b.limit ? Math.round((spent / b.limit) * 1000) / 10 : 0,
    });
  }
  res.json({ rows });
});

// GET /api/reports/budget/export?format=csv|pdf
export const exportBudget = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ user: req.user._id });
  const currency = req.user.currency || 'USD';
  const rows = [];
  for (const b of budgets) {
    const agg = await Expense.aggregate([
      { $match: { user: req.user._id, category: b.category, date: { $gte: periodStart(b.period) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const spent = agg[0]?.total || 0;
    rows.push({ category: b.categoryName, period: b.period, limit: b.limit, spent, variance: b.limit - spent });
  }

  if ((req.query.format || 'csv').toLowerCase() === 'csv') {
    const csv = toCSV(
      rows.map((r) => ({ Category: r.category, Period: r.period, Limit: r.limit, Spent: r.spent, Variance: r.variance })),
      ['Category', 'Period', 'Limit', 'Spent', 'Variance']
    );
    res.header('Content-Type', 'text/csv');
    res.attachment('budget-report.csv');
    return res.send(csv);
  }

  const doc = buildReportDoc({
    title: 'Budget Report',
    subtitle: `Generated ${fmtDate(new Date())}`,
    table: {
      widths: ['*', 'auto', 'auto', 'auto', 'auto'],
      headers: ['Category', 'Period', 'Limit', 'Spent', 'Variance'],
      rows: rows.map((r) => [
        r.category,
        r.period,
        { text: money(r.limit, currency), alignment: 'right' },
        { text: money(r.spent, currency), alignment: 'right' },
        { text: money(r.variance, currency), alignment: 'right', color: r.variance < 0 ? '#dc2626' : '#16a34a' },
      ]),
    },
  });
  const buffer = await renderPDF(doc);
  res.header('Content-Type', 'application/pdf');
  res.attachment('budget-report.pdf');
  res.send(buffer);
});

// GET /api/reports/income — income vs expense summary
export const incomeReport = asyncHandler(async (req, res) => {
  const range = resolveDateRange(req.query);
  const dateMatch = Object.keys(range).length ? { date: range } : {};

  const [income, expense, bySource] = await Promise.all([
    Income.aggregate([{ $match: { user: req.user._id, ...dateMatch } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Expense.aggregate([{ $match: { user: req.user._id, ...dateMatch } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Income.aggregate([
      { $match: { user: req.user._id, ...dateMatch } },
      { $group: { _id: '$source', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  const totalIncome = income[0]?.total || 0;
  const totalExpense = expense[0]?.total || 0;
  res.json({
    totalIncome,
    totalExpense,
    savings: totalIncome - totalExpense,
    bySource: bySource.map((s) => ({ source: s._id, total: s.total })),
  });
});
