// // src/routes/movie.routes.js
// import express from 'express';
// import {
//   createMovie,
//   getAllMovies,
//   getMovieById,
// } from '../controllers/movie.controller.js';
// import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

// const router = express.Router();

// router.post('/', authenticate, authorizeRoles('ADMIN'), createMovie);
// router.get('/', getAllMovies);
// router.get('/:id', getMovieById);

// export default router;
// src/routes/movie.routes.js
import express from 'express';
import {
  createMovie,
  getAllMovies,
  getMovieById,
} from '../controllers/movie.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js'; // Correct import path

const router = express.Router();

router.post('/', authenticate, authorizeRoles('ADMIN'), createMovie);
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

export default router;