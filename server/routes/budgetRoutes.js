import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetAlerts,
} from '../controllers/budgetController.js';

const router = express.Router();
router.use(protect);

router.get('/alerts', getBudgetAlerts);

router.route('/')
  .get(getBudgets)
  .post(
    [
      body('category').notEmpty().withMessage('Category is required'),
      body('limit').isFloat({ gt: 0 }).withMessage('Limit must be greater than 0'),
    ],
    validate,
    createBudget
  );

router.route('/:id').put(updateBudget).delete(deleteBudget);

export default router;
