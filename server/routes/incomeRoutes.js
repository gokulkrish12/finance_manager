import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  summaryBySource,
} from '../controllers/incomeController.js';

const router = express.Router();
router.use(protect);

router.get('/summary/by-source', summaryBySource);

router.route('/')
  .get(getIncome)
  .post(
    [
      body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
      body('source').trim().notEmpty().withMessage('Source is required'),
    ],
    validate,
    createIncome
  );

router.route('/:id').put(updateIncome).delete(deleteIncome);

export default router;
