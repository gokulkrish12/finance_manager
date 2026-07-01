import Category from '../models/Category.js';
import Expense from '../models/Expense.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// GET /api/categories?type=expense|income
export const getCategories = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  const categories = await Category.find(filter).sort({ type: 1, name: 1 });
  res.json(categories);
});

// POST /api/categories
export const createCategory = asyncHandler(async (req, res) => {
  const { name, type, icon, color } = req.body;
  const category = await Category.create({
    user: req.user._id,
    name,
    type: type || 'expense',
    icon,
    color,
  });
  res.status(201).json(category);
});

// PUT /api/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  const { name, icon, color } = req.body;
  if (name !== undefined) category.name = name;
  if (icon !== undefined) category.icon = icon;
  if (color !== undefined) category.color = color;
  await category.save();

  // Keep denormalized names on expenses in sync
  if (name !== undefined) {
    await Expense.updateMany({ category: category._id }, { categoryName: name });
  }
  res.json(category);
});

// DELETE /api/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const inUse = await Expense.countDocuments({ category: category._id });
  if (inUse > 0) {
    res.status(409);
    throw new Error(`Cannot delete: ${inUse} expense(s) use this category. Reassign them first.`);
  }

  await category.deleteOne();
  res.json({ message: 'Category deleted' });
});
