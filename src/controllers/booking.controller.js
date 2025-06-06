// src/controllers/booking.controller.js
import prisma from "../config/prisma.js";

// Create a new booking
export const createBooking = async (req, res) => {
  const userId = req.user.id; // User ID from authenticated request
  const { showId, seatIds } = req.body; // Expect an array of seat IDs from the client

  // Validate incoming data
  if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "Invalid booking data. showId and an array of seatIds are required." });
  }

  // Ensure seatIds are unique to prevent duplicate bookings of the same seat in one transaction
  const uniqueSeatIds = [...new Set(seatIds)];
  if (uniqueSeatIds.length !== seatIds.length) {
      return res.status(400).json({ error: "Duplicate seat IDs provided." });
  }

  try {
    // Start a Prisma transaction for atomicity:
    // All operations within this block succeed or fail together.
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Fetch show details to calculate total price and ensure existence
      const show = await prisma.show.findUnique({
        where: { id: showId },
        include: { screen: true } // Include screen details if needed for additional validation
      });

      if (!show) {
        throw new Error("Show not found.");
      }

      // 2. Fetch the specific ShowSeat entries for the requested seat IDs
      // This ensures the seats exist for this show and are active
      const showSeats = await prisma.showSeat.findMany({
        where: {
          showId: showId,
          seatId: { in: uniqueSeatIds }, // Filter by the unique seat IDs provided
        },
        include: { seat: true } // Include the physical seat details for better error messages
      });

      // 3. Validate that all requested seat IDs actually exist for this show
      if (showSeats.length !== uniqueSeatIds.length) {
        const foundSeatIds = new Set(showSeats.map(ss => ss.seatId));
        const missingSeatIds = uniqueSeatIds.filter(id => !foundSeatIds.has(id));
        throw new Error(`One or more selected seats not found for this show (IDs: ${missingSeatIds.join(', ')}).`);
      }

      // 4. Validate seat availability (ensure no selected seat is already BOOKED or HELD)
      const unavailableSeats = showSeats.filter(
        (ss) => ss.status !== 'AVAILABLE'
      );

      if (unavailableSeats.length > 0) {
        const unavailableSeatNames = unavailableSeats.map(
          (ss) => `${ss.seat.seatRow}${ss.seat.seatColumn}` // Format seat names for clear error
        );
        throw new Error(`The following seats are already booked or held: ${unavailableSeatNames.join(', ')}.`);
      }

      // 5. Calculate total price based on the number of selected seats and show price
      const totalPrice = show.price * uniqueSeatIds.length;

      // 6. Create the booking record
      const booking = await prisma.booking.create({
        data: {
          userId,
          showId,
          totalPrice,
          status: "Confirmed", // Set initial status to 'Confirmed'
          // The 'seats' field is removed as it's now handled by the ShowSeat links
        },
      });

      // 7. Update the status of the selected ShowSeats to 'BOOKED' and link them to the new booking
      // This is done within the transaction to ensure atomic update.
      await prisma.showSeat.updateMany({
        where: {
          showId: showId,
          seatId: { in: uniqueSeatIds },
          status: 'AVAILABLE', // Double-check availability just before updating
        },
        data: {
          status: 'BOOKED',
          bookingId: booking.id, // Link to the newly created booking
        },
      });

      return { booking, showSeats }; // Return relevant data
    });

    res.status(201).json({ message: "Booking successful", booking: result.booking });
  } catch (error) {
    console.error("Booking error:", error);
    // Return specific error messages for user feedback
    res.status(400).json({ error: error.message || "Failed to create booking." });
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
          // IMPORTANT: Nested include for screen and theatre
          include: {
            movie: true,
            screen: { // Include the screen
              include: {
                theatre: true // <--- THIS IS THE KEY ADDITION: Include the theatre within the screen
              }
            },
          },
        },
        bookedSeats: { // Include the specific ShowSeat entries that were booked
          include: { seat: true }, // Also include the physical seat details (row, column, etc.)
          orderBy: [{ seat: { seatRow: 'asc' } }, { seat: { seatColumn: 'asc' } }] // Order for better display
        }
      },
      // Corrected orderBy field from 'bookedAt' to 'bookingTime'
      orderBy: { bookingTime: "desc" }, // <<<--- CORRECTED HERE
    });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
};

// Update booking - (This function is adapted to handle status changes or adding/removing specific seats)
export const updateBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.id);
    const { status, addSeatIds, removeSeatIds } = req.body; // New approach: allow adding/removing specific seats

    // Fetch the existing booking with its currently booked seats
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookedSeats: { select: { id: true, seatId: true, status: true } }, // Get current booked showSeat IDs
        show: true // Include show details for price calculation
      },
    });

    // Validate booking ownership and existence
    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ error: "Booking not found or unauthorized." });
    }

    // Start a transaction for atomicity
    await prisma.$transaction(async (prisma) => {
      let currentBookedSeatIds = booking.bookedSeats.map(bs => bs.seatId);
      let updatedTotalPrice = booking.totalPrice; // Start with current total price

      const show = booking.show; // Use the show object from the fetched booking

      // Handle adding new seats to the booking
      if (Array.isArray(addSeatIds) && addSeatIds.length > 0) {
          // Filter out seats already in this booking
          const newSeatIds = addSeatIds.filter(id => !currentBookedSeatIds.includes(id));

          if (newSeatIds.length > 0) {
              // Find the ShowSeat entries for the new seats and check their availability
              const newShowSeats = await prisma.showSeat.findMany({
                  where: {
                      showId: show.id,
                      seatId: { in: newSeatIds },
                      status: 'AVAILABLE' // Only add if available
                  }
              });

              // If not all requested new seats are available, throw an error
              if (newShowSeats.length !== newSeatIds.length) {
                  throw new Error("One or more new seats are not available or do not exist for this show.");
              }

              // Update the status of these new ShowSeats to 'BOOKED'
              await prisma.showSeat.updateMany({
                  where: { id: { in: newShowSeats.map(ss => ss.id) } },
                  data: { status: 'BOOKED', bookingId: booking.id } // Link to this booking
              });

              // Update total price and current booked seat IDs
              updatedTotalPrice += show.price * newSeatIds.length;
              currentBookedSeatIds = [...currentBookedSeatIds, ...newSeatIds];
          }
      }

      // Handle removing seats from the booking
      if (Array.isArray(removeSeatIds) && removeSeatIds.length > 0) {
          // Filter out seats that are actually part of this booking
          const seatsToRemove = removeSeatIds.filter(id => currentBookedSeatIds.includes(id));

          if (seatsToRemove.length > 0) {
              // Update the status of these ShowSeats to 'AVAILABLE' and unlink from booking
              await prisma.showSeat.updateMany({
                  where: {
                      showId: show.id,
                      seatId: { in: seatsToRemove },
                      bookingId: booking.id, // Ensure it's part of *this* booking
                      status: 'BOOKED' // Ensure it's currently booked by this booking
                  },
                  data: { status: 'AVAILABLE', bookingId: null } // Free the seat
              });

              // Update total price and current booked seat IDs
              updatedTotalPrice -= show.price * seatsToRemove.length;
              currentBookedSeatIds = currentBookedSeatIds.filter(id => !seatsToRemove.includes(id));
          }
      }

      // Update the main booking record (status and total price)
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: status || booking.status, // Update status if provided, else keep current
          totalPrice: updatedTotalPrice, // Update total price based on seat changes
        },
        include: {
            bookedSeats: { include: { seat: true } } // Return updated seats for response
        }
      });
      res.json({ message: "Booking updated", updatedBooking });
    });

  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({ error: error.message || "Failed to update booking." });
  }
};

// Cancel booking (soft delete by setting status and freeing seats)
export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.id);

    // Use a transaction for atomicity
    await prisma.$transaction(async (prisma) => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { bookedSeats: true }, // Include the ShowSeats linked to this booking
      });

      // Validate booking existence and ownership
      if (!booking || booking.userId !== userId) {
        throw new Error("Booking not found or unauthorized.");
      }

      // 1. Update the status of all associated ShowSeats to 'AVAILABLE'
      // This frees up the seats for other bookings
      await prisma.showSeat.updateMany({
        where: {
          bookingId: bookingId,
          status: 'BOOKED' // Only free seats that are currently BOOKED by this booking
        },
        data: {
          status: 'AVAILABLE',
          bookingId: null, // Unlink from this booking
        },
      });

      // 2. Update the main booking status to 'Cancelled'
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "Cancelled" },
      });
    });

    res.json({ message: "Booking cancelled successfully, seats freed." });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ error: error.message || "Failed to cancel booking." });
  }
};