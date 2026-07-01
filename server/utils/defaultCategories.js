import Category from '../models/Category.js';

/**
 * Categories every new user starts with. Users can add/edit/delete their own.
 */
export const DEFAULT_CATEGORIES = [
  { name: 'Groceries', type: 'expense', icon: '🛒', color: '#22c55e' },
  { name: 'Rent', type: 'expense', icon: '🏠', color: '#ef4444' },
  { name: 'Utilities', type: 'expense', icon: '💡', color: '#f59e0b' },
  { name: 'Transport', type: 'expense', icon: '🚗', color: '#3b82f6' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#a855f7' },
  { name: 'Dining Out', type: 'expense', icon: '🍽️', color: '#ec4899' },
  { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#14b8a6' },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#f97316' },
  { name: 'Education', type: 'expense', icon: '📚', color: '#6366f1' },
  { name: 'Other', type: 'expense', icon: '💸', color: '#64748b' },
  { name: 'Salary', type: 'income', icon: '💰', color: '#16a34a' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#0ea5e9' },
  { name: 'Investments', type: 'income', icon: '📈', color: '#84cc16' },
  { name: 'Other Income', type: 'income', icon: '➕', color: '#64748b' },
];

/**
 * Seed the default categories for a freshly-registered user.
 */
export const seedDefaultCategories = async (userId) => {
  const docs = DEFAULT_CATEGORIES.map((c) => ({ ...c, user: userId, isDefault: true }));
  await Category.insertMany(docs);
};
