// // src/routes/theatre.routes.js
// import express from 'express';
// import {
//   createTheatre,
//   getAllTheatres,
//   getOwnerTheatres,
//   deleteTheatre,
// } from '../controllers/theatre.controller.js';
// import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

// const router = express.Router();

// // Public: List all theatres
// router.get('/', getAllTheatres);

// // Owner only
// router.post('/', authenticate, authorizeRoles('OWNER'), createTheatre);
// router.get('/my', authenticate, authorizeRoles('OWNER'), getOwnerTheatres);
// router.delete('/:id', authenticate, authorizeRoles('OWNER'), deleteTheatre);

// export default router;
// src/routes/theatre.routes.js
import express from 'express';
import {
  createTheatre,
  getAllTheatres,
  getOwnerTheatres,
  deleteTheatre,
} from '../controllers/theatre.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js'; // Correct import path

const router = express.Router();

// Public: List all theatres
router.get('/', getAllTheatres);

// Owner only
router.post('/', authenticate, authorizeRoles('OWNER'), createTheatre);
router.get('/my', authenticate, authorizeRoles('OWNER'), getOwnerTheatres);
router.delete('/:id', authenticate, authorizeRoles('OWNER'), deleteTheatre);

export default router;