// // movie-ticket-backend/src/routes/theatre.routes.js
// import express from 'express';
// import {
//   createTheatre,
//   getAllTheatres,
//   getOwnerTheatres,
//   deleteTheatre,
//   getTheatreById,
//   updateTheatre
// } from '../controllers/theatre.controller.js';
// import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js'; // Ensure correct path to auth.middleware.js

// const router = express.Router();

// // Publicly accessible routes
// router.get('/', getAllTheatres); // Get all theatres
// router.get('/:id', getTheatreById); // Add this route for fetching a single theatre by ID

// // Owner/Admin accessible routes (require authentication and specific roles)
// router.post('/', authenticate, authorizeRoles(['OWNER', 'ADMIN']), createTheatre);
// router.get('/my', authenticate, authorizeRoles(['OWNER', 'ADMIN']), getOwnerTheatres);
// router.delete('/:id', authenticate, authorizeRoles(['OWNER', 'ADMIN']), deleteTheatre);
// router.put('/:id', authenticate, authorizeRoles(['OWNER', 'ADMIN']), updateTheatre);

// export default router;

// movie-ticket-backend/src/routes/theatre.routes.js
import express from 'express';
import {
  createTheatre,
  getAllTheatres,
  getOwnerTheatres,
  deleteTheatre,
  getTheatreById,
  updateTheatre
} from '../controllers/theatre.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js'; // Ensure correct path to auth.middleware.js

const router = express.Router();

// Publicly accessible routes
router.get('/', getAllTheatres); // Get all theatres

// OWNER/ADMIN Specific Routes - Place more specific routes BEFORE general ones
// It's crucial that '/my' comes BEFORE '/:id'
router.get('/my', authenticate, authorizeRoles(['OWNER', 'ADMIN']), getOwnerTheatres); // Get theatres owned by current user

// General Theatre by ID route (will catch any ID after 'theatres/')
// This route MUST come AFTER more specific static routes like '/my'
router.get('/:id', getTheatreById); // Add this route for fetching a single theatre by ID

// Owner/Admin accessible routes (require authentication and specific roles)
router.post('/', authenticate, authorizeRoles(['OWNER', 'ADMIN']), createTheatre);
router.delete('/:id', authenticate, authorizeRoles(['OWNER', 'ADMIN']), deleteTheatre);
router.put('/:id', authenticate, authorizeRoles(['OWNER', 'ADMIN']), updateTheatre);

export default router;