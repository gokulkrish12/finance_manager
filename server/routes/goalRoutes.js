import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  getGoals,
  createGoal,
  updateGoal,
  contribute,
  deleteGoal,
} from '../controllers/goalController.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getGoals)
  .post(
    [
      body('title').trim().notEmpty().withMessage('Title is required'),
      body('targetAmount').isFloat({ gt: 0 }).withMessage('Target must be greater than 0'),
      body('deadline').notEmpty().withMessage('Deadline is required'),
    ],
    validate,
    createGoal
  );

router.post('/:id/contribute', contribute);
router.route('/:id').put(updateGoal).delete(deleteGoal);

export default router;
