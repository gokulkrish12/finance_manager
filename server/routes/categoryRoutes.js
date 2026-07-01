import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getCategories)
  .post([body('name').trim().notEmpty().withMessage('Name is required')], validate, createCategory);

router.route('/:id').put(updateCategory).delete(deleteCategory);

export default router;
