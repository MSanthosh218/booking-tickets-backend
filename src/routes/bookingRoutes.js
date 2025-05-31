import express from "express";
import {
  createBooking,
  getUserBookings,
  updateBooking,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect); // All routes protected, user must be logged in

router.post("/", createBooking);
router.get("/", getUserBookings);
router.put("/:id", updateBooking);
router.delete("/:id", cancelBooking);

export default router;
