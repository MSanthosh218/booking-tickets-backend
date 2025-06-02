// import prisma from "../config/prisma.js";

// // Create a new booking
// export const createBooking = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { showId, seats } = req.body;

//     if (!showId || !seats || seats <= 0) {
//       return res.status(400).json({ error: "Invalid booking data" });
//     }

//     // Fetch show details to calculate total price
//     const show = await prisma.show.findUnique({
//       where: { id: showId },
//     });

//     if (!show) {
//       return res.status(404).json({ error: "Show not found" });
//     }

//     const totalPrice = show.price * seats;

//     const booking = await prisma.booking.create({
//       data: {
//         userId,
//         showId,
//         seats,
//         totalPrice,
//       },
//     });

//     res.status(201).json({ message: "Booking successful", booking });
//   } catch (error) {
//     console.error("Booking error:", error);
//     res.status(500).json({ error: "Failed to create booking" });
//   }
// };

// // Get bookings of logged-in user
// export const getUserBookings = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const bookings = await prisma.booking.findMany({
//       where: { userId },
//       include: {
//         show: {
//           include: { movie: true, screen: true },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     res.json(bookings);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch bookings" });
//   }
// };

// // Update booking - for example, change seats or cancel
// export const updateBooking = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const bookingId = parseInt(req.params.id);
//     const { seats, status } = req.body;

//     const booking = await prisma.booking.findUnique({
//       where: { id: bookingId },
//     });

//     if (!booking || booking.userId !== userId) {
//       return res.status(404).json({ error: "Booking not found" });
//     }

//     let totalPrice;

//     if (seats) {
//       // Recalculate price if seats updated
//       const show = await prisma.show.findUnique({
//         where: { id: booking.showId },
//       });
//       totalPrice = show.price * seats;
//     }

//     const updatedBooking = await prisma.booking.update({
//       where: { id: bookingId },
//       data: {
//         seats: seats || booking.seats,
//         status: status || booking.status,
//         totalPrice: totalPrice || booking.totalPrice,
//       },
//     });

//     res.json({ message: "Booking updated", updatedBooking });
//   } catch (error) {
//     console.error("Update booking error:", error);
//     res.status(500).json({ error: "Failed to update booking" });
//   }
// };

// // Cancel booking (soft delete by setting status)
// export const cancelBooking = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const bookingId = parseInt(req.params.id);

//     const booking = await prisma.booking.findUnique({
//       where: { id: bookingId },
//     });

//     if (!booking || booking.userId !== userId) {
//       return res.status(404).json({ error: "Booking not found" });
//     }

//     await prisma.booking.update({
//       where: { id: bookingId },
//       data: { status: "cancelled" },
//     });

//     res.json({ message: "Booking cancelled successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to cancel booking" });
//   }
// };
import prisma from "../config/prisma.js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { showId, seats } = req.body;

    if (!showId || !seats || seats <= 0) {
      return res.status(400).json({ error: "Invalid booking data" });
    }

    // Fetch show details to calculate total price
    const show = await prisma.show.findUnique({
      where: { id: showId },
    });

    if (!show) {
      return res.status(404).json({ error: "Show not found" });
    }

    const totalPrice = show.price * seats;

    const booking = await prisma.booking.create({
      data: {
        userId,
        showId,
        seats,
        totalPrice,
      },
    });

    res.status(201).json({ message: "Booking successful", booking });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

// Get bookings of logged-in user
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        show: {
          include: { movie: true, screen: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// Update booking - for example, change seats or cancel
export const updateBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.id);
    const { seats, status } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ error: "Booking not found" });
    }

    let totalPrice;

    if (seats !== undefined) {
      // Recalculate price if seats updated
      const show = await prisma.show.findUnique({
        where: { id: booking.showId },
      });
      if (!show) {
        return res.status(404).json({ error: "Associated show not found" });
      }
      totalPrice = show.price * seats;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        seats: seats !== undefined ? seats : booking.seats,
        status: status || booking.status,
        totalPrice: totalPrice !== undefined ? totalPrice : booking.totalPrice,
      },
    });

    res.json({ message: "Booking updated", updatedBooking });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({ error: "Failed to update booking" });
  }
};

// Cancel booking (soft delete by setting status)
export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ error: "Booking not found" });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "cancelled" },
    });

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};