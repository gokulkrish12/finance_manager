import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  expenseReport,
  exportExpenses,
  budgetReport,
  exportBudget,
  incomeReport,
} from '../controllers/reportController.js';

const router = express.Router();
router.use(protect);

router.get('/expenses', expenseReport);
router.get('/expenses/export', exportExpenses);
router.get('/budget', budgetReport);
router.get('/budget/export', exportBudget);
router.get('/income', incomeReport);

export default router;
