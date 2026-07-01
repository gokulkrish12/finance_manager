import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  summaryByCategory,
  summaryTrend,
} from '../controllers/expenseController.js';

const router = express.Router();
router.use(protect);

// summary routes must be declared before '/:id'
router.get('/summary/by-category', summaryByCategory);
router.get('/summary/trend', summaryTrend);

router.route('/')
  .get(getExpenses)
  .post(
    [
      body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
      body('category').notEmpty().withMessage('Category is required'),
    ],
    validate,
    createExpense
  );

router.route('/:id').get(getExpense).put(updateExpense).delete(deleteExpense);

export default router;
