// import express from 'express';
// import {
//   createMovie,
//   getAllMovies,
//   getMovieById,
// } from '../controllers/movie.controller.js';
// import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

// const router = express.Router();

// // Admin only: Create a new movie
// router.post('/', authenticate, authorizeRoles(['ADMIN']), createMovie);

// // Publicly accessible: Get all movies and get movie by ID
// router.get('/', getAllMovies);
// router.get('/:id', getMovieById);

// export default router;

import express from 'express';
import {
  createMovie,
  getAllMovies,
  getMovieById,
  deleteMovie, // Added deleteMovie import
  updateMovie, // Added updateMovie import
} from '../controllers/movie.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin only: Create a new movie
router.post('/', authenticate, authorizeRoles(['ADMIN']), createMovie);

// Publicly accessible: Get all movies and get movie by ID
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Admin only: Delete a movie by ID
router.delete('/:id', authenticate, authorizeRoles(['ADMIN']), deleteMovie);

// Admin only: Update a movie by ID
router.put('/:id', authenticate, authorizeRoles(['ADMIN']), updateMovie);

export default router;