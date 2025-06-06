import express from 'express';
import {
  createShow,
  getAllShows,
  getShowById,
  updateShow,
  deleteShow,
  getShowSeats // NEW: Import the new controller function for fetching show seats
} from '../controllers/show.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public: Get all shows or specific show details
router.get('/', getAllShows);           // Get all shows (can be filtered by query params)
router.get('/:id', getShowById);       // Get a single show by ID (now includes seats status)
router.get('/:id/seats', getShowSeats); // NEW ROUTE: Get the availability status of all seats for a specific show

// Owner/Admin only: Create, update, delete shows
router.post('/', authenticate, authorizeRoles(['OWNER', 'ADMIN']), createShow);
router.put('/:id', authenticate, authorizeRoles(['OWNER', 'ADMIN']), updateShow);
router.delete('/:id', authenticate, authorizeRoles(['OWNER', 'ADMIN']), deleteShow);

export default router;