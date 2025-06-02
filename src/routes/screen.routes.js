// src/routes/screen.routes.js
import express from 'express';
import {
  createScreen,
  getScreensByTheatre,
  getScreenById, // Added for completeness, optional
  updateScreen, // Added for completeness, optional
  deleteScreen // Added for completeness, optional
} from '../controllers/screen.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get screens by theatre (publically accessible to view showtimes)
router.get('/theatres/:theatreId', getScreensByTheatre);
router.get('/:id', getScreenById); // Get single screen by ID

// Owner/Admin only
router.post('/', authenticate, authorizeRoles('OWNER', 'ADMIN'), createScreen);
router.put('/:id', authenticate, authorizeRoles('OWNER', 'ADMIN'), updateScreen);
router.delete('/:id', authenticate, authorizeRoles('OWNER', 'ADMIN'), deleteScreen);


export default router;