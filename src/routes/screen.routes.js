import express from 'express';
import {
  createScreen,
  getScreensByTheatre,
  getScreenById,
  updateScreen,
  deleteScreen
} from '../controllers/screen.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public: Get all screens for a specific theatre (e.g., for user to view screen layouts)
router.get('/theatres/:theatreId', getScreensByTheatre);
router.get('/:id', getScreenById); // Get a single screen by ID (potentially with its seats)

// Owner/Admin only: Create, update, delete screens
router.post('/', authenticate, authorizeRoles(['OWNER', 'ADMIN']), createScreen);
router.put('/:id', authenticate, authorizeRoles(['OWNER', 'ADMIN']), updateScreen);
router.delete('/:id', authenticate, authorizeRoles(['OWNER', 'ADMIN']), deleteScreen);


export default router;