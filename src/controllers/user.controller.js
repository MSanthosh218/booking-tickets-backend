// src/controllers/user.controller.js
import prisma from '../config/prisma.js';

/**
 * @desc Get all users
 * @route GET /api/users
 * @access Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users, but select only the necessary fields for security (no passwords!)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true, // Useful for sorting or display
        updatedAt: true, // Useful for tracking changes
      },
      orderBy: { createdAt: 'desc' }, // Order by creation date, newest first
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * @desc Delete a user
 * @route DELETE /api/users/:id
 * @access Admin
 */
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Ensure the ID is a number
        const userIdToDelete = Number(id);
        if (isNaN(userIdToDelete)) {
            return res.status(400).json({ message: 'Invalid user ID provided.' });
        }

        const user = await prisma.user.findUnique({ where: { id: userIdToDelete } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Optional: Prevent an admin from deleting their own account via this endpoint
        if (req.user.id === userIdToDelete) {
            return res.status(403).json({ message: 'Forbidden: Cannot delete your own account via this endpoint.' });
        }

        // Before deleting the user, consider if related data (bookings) should also be deleted
        // or re-assigned. For simplicity, we'll just delete the user here.
        // In a real application, you might want to soft delete or handle related data.
        await prisma.user.delete({ where: { id: userIdToDelete } });

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};