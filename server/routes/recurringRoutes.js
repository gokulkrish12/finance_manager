import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  runRecurring,
} from '../controllers/recurringController.js';

const router = express.Router();
router.use(protect);

router.post('/run', runRecurring);

router.route('/')
  .get(getRecurring)
  .post(
    [
      body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
      body('category').notEmpty().withMessage('Category is required'),
    ],
    validate,
    createRecurring
  );

router.route('/:id').put(updateRecurring).delete(deleteRecurring);

export default router;
