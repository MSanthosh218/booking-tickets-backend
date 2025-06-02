// src/routes/show.routes.js
import express from 'express';
import {
  createShow,
  getAllShows,
  getShowById,
  updateShow, // Added for completeness, optional
  deleteShow // Added for completeness, optional
} from '../controllers/show.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public: Get all shows or specific show details
router.get('/', getAllShows);
router.get('/:id', getShowById);

// Owner/Admin only
router.post('/', authenticate, authorizeRoles('OWNER', 'ADMIN'), createShow);
router.put('/:id', authenticate, authorizeRoles('OWNER', 'ADMIN'), updateShow);
router.delete('/:id', authenticate, authorizeRoles('OWNER', 'ADMIN'), deleteShow);

export default router;