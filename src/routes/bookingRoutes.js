import express from "express";
import {
  createBooking,
  getUserBookings,
  updateBooking,
  cancelBooking,
} from "../controllers/booking.controller.js"; // Corrected controller name if it was different
import { authenticate } from "../middlewares/auth.middleware.js"; // Using 'authenticate' from 'auth.middleware.js'

const router = express.Router();

// Apply authentication middleware to all booking routes
router.use(authenticate);

// Define booking routes
router.post("/", createBooking);       // Create a new booking (now expects seatIds)
router.get("/", getUserBookings);     // Get bookings of the logged-in user
router.put("/:id", updateBooking);    // Update a specific booking (e.g., change status, add/remove seats)
router.delete("/:id", cancelBooking); // Cancel a specific booking

export default router;