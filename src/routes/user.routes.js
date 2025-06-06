// src/routes/user.routes.js
import express from 'express';
import { getAllUsers, deleteUser } from '../controllers/user.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js'; // Import your middleware

const router = express.Router();

// Define routes for /api/users
// GET /api/users - Get all users (Admin only)
router.get('/', authenticate, authorizeRoles(['ADMIN']), getAllUsers);

// DELETE /api/users/:id - Delete a user by ID (Admin only)
router.delete('/:id', authenticate, authorizeRoles(['ADMIN']), deleteUser);

export default router;