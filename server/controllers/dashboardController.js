import Expense from '../models/Expense.js';
import Income from '../models/Income.js';
import Goal from '../models/Goal.js';
import Budget from '../models/Budget.js';
import RecurringExpense from '../models/RecurringExpense.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { periodStart } from '../utils/dateRange.js';

const sum = (agg) => agg[0]?.total || 0;

// GET /api/dashboard — headline numbers for the home screen
export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const monthStart = periodStart('monthly');
  const yearStart = periodStart('yearly');

  const [
    monthExpense,
    monthIncome,
    yearExpense,
    yearIncome,
    activeGoals,
    budgets,
    upcoming,
  ] = await Promise.all([
    Expense.aggregate([{ $match: { user: userId, date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Income.aggregate([{ $match: { user: userId, date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Expense.aggregate([{ $match: { user: userId, date: { $gte: yearStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Income.aggregate([{ $match: { user: userId, date: { $gte: yearStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Goal.countDocuments({ user: userId, status: 'active' }),
    Budget.find({ user: userId }),
    RecurringExpense.find({ user: userId, active: true }).sort({ nextRun: 1 }).limit(5).select('description categoryName amount nextRun frequency'),
  ]);

  // Budget health: how many are in warning/exceeded this month
  let exceeded = 0;
  for (const b of budgets) {
    const spent = sum(
      await Expense.aggregate([
        { $match: { user: userId, category: b.category, date: { $gte: periodStart(b.period) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
    );
    if (spent >= b.limit) exceeded++;
  }

  const monthExp = sum(monthExpense);
  const monthInc = sum(monthIncome);

  res.json({
    month: {
      expense: monthExp,
      income: monthInc,
      savings: monthInc - monthExp,
      savingsRate: monthInc > 0 ? Math.round(((monthInc - monthExp) / monthInc) * 100) : 0,
    },
    year: { expense: sum(yearExpense), income: sum(yearIncome), savings: sum(yearIncome) - sum(yearExpense) },
    activeGoals,
    budgetsTotal: budgets.length,
    budgetsExceeded: exceeded,
    upcomingRecurring: upcoming,
  });
});
