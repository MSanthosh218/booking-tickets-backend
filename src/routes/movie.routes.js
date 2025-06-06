import express from 'express';
import {
  createMovie,
  getAllMovies,
  getMovieById,
} from '../controllers/movie.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin only: Create a new movie
router.post('/', authenticate, authorizeRoles(['ADMIN']), createMovie);

// Publicly accessible: Get all movies and get movie by ID
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

export default router;