import prisma from '../config/prisma.js';

// Create a new show and automatically initialize its ShowSeat entries
export const createShow = async (req, res) => {
  const { movieId, theatreId, screenId, showTime, price } = req.body;
  const userId = req.user.id; // User creating the show (owner or admin)

  if (!movieId || !theatreId || !screenId || !showTime || !price) {
    return res.status(400).json({ error: 'All show fields are required (movieId, theatreId, screenId, showTime, price).' });
  }
  if (Number(price) <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number.' });
  }

  try {
    // Validate existence of movie, theatre, and screen
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    const theatre = await prisma.theatre.findUnique({ where: { id: theatreId } });
    const screen = await prisma.screen.findUnique({
        where: { id: screenId },
        include: { seats: true } // Include all physical seats of the screen to create ShowSeats
    });

    if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    if (!theatre) return res.status(404).json({ error: 'Theatre not found.' });
    if (!screen) return res.status(404).json({ error: 'Screen not found.' });

    // Ensure the screen belongs to the specified theatre
    if (screen.theatreId !== theatre.id) {
      return res.status(400).json({ error: 'Screen does not belong to the specified theatre.' });
    }

    // If user is OWNER, ensure they own this theatre
    if (req.user.role === 'OWNER' && theatre.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this theatre.' });
    }

    // Use a Prisma transaction for atomicity: create show and its ShowSeats together
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create the show record
      const show = await prisma.show.create({
        data: {
          movieId: Number(movieId),
          theatreId: Number(theatreId),
          screenId: Number(screenId),
          showTime: new Date(showTime), // Convert string to Date object
          price: Number(price),
        },
      });

      // 2. Initialize ShowSeats for all physical seats in this screen for this new show
      const showSeatsToCreate = screen.seats.map(seat => ({
        showId: show.id,
        seatId: seat.id,
        status: 'AVAILABLE', // All seats are available initially for a new show
      }));

      // Create the ShowSeat entries in bulk
      if (showSeatsToCreate.length > 0) {
        await prisma.showSeat.createMany({
          data: showSeatsToCreate,
        });
      }

      return show;
    });

    res.status(201).json({ message: 'Show created successfully and seats initialized.', show: result });
  } catch (error) {
    console.error('Create Show Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create show.' });
  }
};

// Get all shows (with optional filtering/inclusion)
export const getAllShows = async (req, res) => {
  const { movieId, theatreId, screenId } = req.query; // Query parameters for filtering

  try {
    const where = {};
    if (movieId) where.movieId = Number(movieId);
    if (theatreId) where.theatreId = Number(theatreId);
    if (screenId) where.screenId = Number(screenId);

    const shows = await prisma.show.findMany({
      where,
      include: {
        movie: { select: { id: true, title: true, language: true, duration: true, posterUrl: true } },
        theatre: { select: { id: true, name: true, location: true } },
        screen: { select: { id: true, name: true, capacity: true } },
      },
      orderBy: { showTime: 'asc' }, // Order shows by time
    });
    res.status(200).json(shows);
  } catch (error) {
    console.error('Get All Shows Error:', error);
    res.status(500).json({ error: 'Failed to retrieve shows.' });
  }
};

// NEW: Get all seats and their status for a specific show
export const getShowSeats = async (req, res) => {
    const { id } = req.params; // This 'id' is the showId

    try {
        const showSeats = await prisma.showSeat.findMany({
            where: { showId: Number(id) },
            include: {
                seat: { // Include physical seat details (row, column, type)
                    select: { id: true, seatRow: true, seatColumn: true, seatType: true }
                }
            },
            orderBy: [
                { seat: { seatRow: 'asc' } },    // Order by row first
                { seat: { seatColumn: 'asc' } } // Then by column
            ]
        });

        if (!showSeats || showSeats.length === 0) {
            // It's possible a show exists but has no associated seats, or the ID is wrong
            return res.status(404).json({ error: 'No seat layout found for this show, or show does not exist.' });
        }
        res.status(200).json(showSeats);
    } catch (error) {
        console.error('Get Show Seats Error:', error);
        res.status(500).json({ error: 'Failed to retrieve show seats.' });
    }
};


// Get a single show by ID (modified to include all its ShowSeats and related bookings)
export const getShowById = async (req, res) => {
  const { id } = req.params;
  try {
    const show = await prisma.show.findUnique({
      where: { id: Number(id) },
      include: {
        movie: true,
        theatre: true,
        screen: true,
        showSeats: { // Include the status of all seats for this show
            include: { seat: true }, // Include physical seat details
            orderBy: [{ seat: { seatRow: 'asc' } }, { seat: { seatColumn: 'asc' } }]
        },
        bookings: { // Include bookings associated with this show
            include: {
                user: { select: { id: true, name: true, email: true } },
                bookedSeats: { include: { seat: true } } // Include the specific seats booked in each booking
            }
        }
      },
    });
    if (!show) {
      return res.status(404).json({ error: 'Show not found.' });
    }
    res.status(200).json(show);
  } catch (error) {
    console.error('Get Show By ID Error:', error);
    res.status(500).json({ error: 'Failed to retrieve show.' });
  }
};

// Update a show
export const updateShow = async (req, res) => {
  const { id } = req.params;
  const { movieId, theatreId, screenId, showTime, price } = req.body;
  const userId = req.user.id;

  try {
    const show = await prisma.show.findUnique({ where: { id: Number(id) } });
    if (!show) {
      return res.status(404).json({ error: 'Show not found.' });
    }

    const theatre = await prisma.theatre.findUnique({ where: { id: show.theatreId } });
    if (req.user.role === 'OWNER' && theatre.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this show/theatre.' });
    }

    // Optional: Re-validate movie, theatre, screen if their IDs are being changed
    // If screenId changes, the `ShowSeat` entries would become invalid,
    // requiring a complex re-initialization or forcing show re-creation.
    // For simplicity, we are not handling screenId change logic here automatically.
    if (screenId && theatreId) {
      const updatedScreen = await prisma.screen.findUnique({ where: { id: Number(screenId) } });
      if (updatedScreen && updatedScreen.theatreId !== Number(theatreId)) {
        return res.status(400).json({ error: 'Updated screen does not belong to the updated theatre.' });
      }
    }

    const updatedShow = await prisma.show.update({
      where: { id: Number(id) },
      data: {
        movieId: movieId ? Number(movieId) : show.movieId,
        theatreId: theatreId ? Number(theatreId) : show.theatreId,
        screenId: screenId ? Number(screenId) : show.screenId,
        showTime: showTime ? new Date(showTime) : show.showTime,
        price: price ? Number(price) : show.price,
      },
    });
    res.status(200).json({ message: 'Show updated successfully', updatedShow });
  } catch (error) {
    console.error('Update Show Error:', error);
    res.status(500).json({ error: 'Failed to update show.' });
  }
};

// Delete a show (modified to also delete associated ShowSeats and Bookings)
export const deleteShow = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const show = await prisma.show.findUnique({ where: { id: Number(id) } });
    if (!show) {
      return res.status(404).json({ error: 'Show not found.' });
    }

    const theatre = await prisma.theatre.findUnique({ where: { id: show.theatreId } });
    if (req.user.role === 'OWNER' && theatre.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this show/theatre.' });
    }

    // Check if there are any *active* bookings associated with this show
    const relatedActiveBookingsCount = await prisma.booking.count({
      where: {
        showId: Number(id),
        status: { not: "Cancelled" } // Only count bookings not in 'Cancelled' status
      },
    });

    if (relatedActiveBookingsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete show with active bookings. Please ensure all associated bookings are cancelled first.' });
    }

    // Use a Prisma transaction to delete related data atomically
    await prisma.$transaction(async (prisma) => {
        // 1. Delete all ShowSeat entries for this show
        // This implicitly frees up seats that might have been part of cancelled bookings
        await prisma.showSeat.deleteMany({
            where: { showId: Number(id) }
        });

        // 2. Delete all Booking entries for this show (including cancelled ones)
        await prisma.booking.deleteMany({
            where: { showId: Number(id) }
        });

        // 3. Finally, delete the show itself
        await prisma.show.delete({
            where: { id: Number(id) },
        });
    });

    res.status(200).json({ message: 'Show and its associated data deleted successfully.' });
  } catch (error) {
    console.error('Delete Show Error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete show.' });
  }
};