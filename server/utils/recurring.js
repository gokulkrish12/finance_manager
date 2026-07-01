import RecurringExpense from '../models/RecurringExpense.js';
import Expense from '../models/Expense.js';

/**
 * Advance a date by one interval of the given frequency.
 */
export const advance = (date, frequency) => {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d;
};

/**
 * Process every due recurring rule: create the expense(s) it owes and roll
 * nextRun forward. Runs both from the cron job and can be called on demand.
 * Returns the number of expenses created.
 */
export const processDueRecurring = async (now = new Date()) => {
  const due = await RecurringExpense.find({ active: true, nextRun: { $lte: now } });
  let created = 0;

  for (const rule of due) {
    // Catch up on any missed occurrences (e.g. server was offline)
    let guard = 0;
    while (rule.nextRun <= now && (!rule.endDate || rule.nextRun <= rule.endDate) && guard < 500) {
      await Expense.create({
        user: rule.user,
        amount: rule.amount,
        category: rule.category,
        categoryName: rule.categoryName,
        description: rule.description || `${rule.categoryName} (recurring)`,
        date: rule.nextRun,
        recurring: rule._id,
      });
      created++;
      rule.lastRun = rule.nextRun;
      rule.nextRun = advance(rule.nextRun, rule.frequency);
      guard++;
    }

    if (rule.endDate && rule.nextRun > rule.endDate) rule.active = false;
    await rule.save();
  }

  return created;
};
