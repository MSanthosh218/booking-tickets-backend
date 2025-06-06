import express from 'express';
import {
  createTheatre,
  getAllTheatres,
  getOwnerTheatres,
  deleteTheatre,
} from '../controllers/theatre.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public: List all theatres
router.get('/', getAllTheatres);

// Owner only: Create, get owner's theatres, delete theatres
router.post('/', authenticate, authorizeRoles(['OWNER', 'ADMIN']), createTheatre); // Admin can also create theatres
router.get('/my', authenticate, authorizeRoles(['OWNER', 'ADMIN']), getOwnerTheatres); // Admin can also view owner theatres
router.delete('/:id', authenticate, authorizeRoles(['OWNER', 'ADMIN']), deleteTheatre); // Admin can also delete theatres

export default router;