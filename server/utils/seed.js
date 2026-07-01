/**
 * Seed a demo account with realistic sample data.
 * Run with:  npm run seed
 * Login:     demo@fintrack.app / demo1234
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Expense from '../models/Expense.js';
import Income from '../models/Income.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import RecurringExpense from '../models/RecurringExpense.js';
import { seedDefaultCategories } from './defaultCategories.js';
import { advance } from './recurring.js';

const DEMO_EMAIL = 'demo@fintrack.app';
const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const run = async () => {
  await connectDB();

  // Wipe any prior demo user + its data
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    const uid = existing._id;
    await Promise.all([
      Category.deleteMany({ user: uid }),
      Expense.deleteMany({ user: uid }),
      Income.deleteMany({ user: uid }),
      Budget.deleteMany({ user: uid }),
      Goal.deleteMany({ user: uid }),
      RecurringExpense.deleteMany({ user: uid }),
      User.deleteOne({ _id: uid }),
    ]);
    console.log('• Cleared previous demo data');
  }

  const user = await User.create({ name: 'Demo User', email: DEMO_EMAIL, password: 'demo1234', currency: 'USD' });
  await seedDefaultCategories(user._id);
  const cats = await Category.find({ user: user._id });
  const expCats = cats.filter((c) => c.type === 'expense');
  const catByName = Object.fromEntries(cats.map((c) => [c.name, c]));

  // 4 months of expenses
  const expenses = [];
  const now = new Date();
  for (let monthsAgo = 3; monthsAgo >= 0; monthsAgo--) {
    const count = Math.floor(rand(18, 30));
    for (let i = 0; i < count; i++) {
      const cat = pick(expCats);
      const day = Math.floor(rand(1, 28));
      const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
      if (date > now) continue;
      expenses.push({
        user: user._id,
        amount: rand(5, 220),
        category: cat._id,
        categoryName: cat.name,
        description: `${cat.name} purchase`,
        date,
      });
    }
  }
  await Expense.insertMany(expenses);

  // Monthly salary income
  const income = [];
  for (let monthsAgo = 3; monthsAgo >= 0; monthsAgo--) {
    income.push({
      user: user._id,
      amount: 4200,
      source: 'Salary',
      description: 'Monthly salary',
      date: new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1),
    });
  }
  income.push({ user: user._id, amount: rand(400, 900), source: 'Freelance', description: 'Side project', date: now });
  await Income.insertMany(income);

  // Budgets
  await Budget.insertMany(
    [
      ['Groceries', 500],
      ['Dining Out', 250],
      ['Entertainment', 150],
      ['Transport', 200],
    ].map(([name, limit]) => ({
      user: user._id,
      category: catByName[name]._id,
      categoryName: name,
      limit,
      period: 'monthly',
    }))
  );

  // Goals
  await Goal.create([
    { user: user._id, title: 'Emergency Fund', targetAmount: 10000, currentAmount: 6500, deadline: new Date(now.getFullYear() + 1, 0, 1), description: '3 months of expenses' },
    { user: user._id, title: 'Vacation to Japan', targetAmount: 4000, currentAmount: 1200, deadline: new Date(now.getFullYear(), now.getMonth() + 6, 1) },
  ]);

  // Recurring
  const rentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  await RecurringExpense.create([
    { user: user._id, amount: 1200, category: catByName['Rent']._id, categoryName: 'Rent', description: 'Apartment rent', frequency: 'monthly', startDate: rentStart, nextRun: advance(rentStart, 'monthly') },
    { user: user._id, amount: 15.99, category: catByName['Entertainment']._id, categoryName: 'Entertainment', description: 'Netflix', frequency: 'monthly', startDate: rentStart, nextRun: advance(rentStart, 'monthly') },
  ]);

  console.log('\n✔ Seed complete!');
  console.log('  Login → demo@fintrack.app / demo1234');
  console.log(`  Created ${expenses.length} expenses, ${income.length} income entries, 4 budgets, 2 goals, 2 recurring rules.\n`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
