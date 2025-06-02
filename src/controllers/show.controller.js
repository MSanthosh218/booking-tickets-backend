// src/controllers/show.controller.js
import prisma from '../config/prisma.js';

// Create a new show
export const createShow = async (req, res) => {
  const { movieId, theatreId, screenId, showTime, price } = req.body;
  const userId = req.user.id; // User creating the show (owner or admin)

  if (!movieId || !theatreId || !screenId || !showTime || !price) {
    return res.status(400).json({ error: 'All show fields are required.' });
  }

  try {
    // Validate existence of movie, theatre, and screen
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    const theatre = await prisma.theatre.findUnique({ where: { id: theatreId } });
    const screen = await prisma.screen.findUnique({ where: { id: screenId } });

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

    const show = await prisma.show.create({
      data: {
        movieId: Number(movieId),
        theatreId: Number(theatreId),
        screenId: Number(screenId),
        showTime: new Date(showTime),
        price: Number(price),
      },
    });
    res.status(201).json({ message: 'Show created successfully', show });
  } catch (error) {
    console.error('Create Show Error:', error);
    res.status(500).json({ error: 'Failed to create show.' });
  }
};

// Get all shows (with optional filtering/inclusion)
export const getAllShows = async (req, res) => {
  const { movieId, theatreId, screenId } = req.query; // Add query parameters for filtering

  try {
    const where = {};
    if (movieId) where.movieId = Number(movieId);
    if (theatreId) where.theatreId = Number(theatreId);
    if (screenId) where.screenId = Number(screenId);

    const shows = await prisma.show.findMany({
      where,
      include: {
        movie: { select: { id: true, title: true, language: true, duration: true } },
        theatre: { select: { id: true, name: true, location: true } },
        screen: { select: { id: true, name: true, capacity: true } },
      },
      orderBy: { showTime: 'asc' },
    });
    res.status(200).json(shows);
  } catch (error) {
    console.error('Get All Shows Error:', error);
    res.status(500).json({ error: 'Failed to retrieve shows.' });
  }
};

// Get a single show by ID
export const getShowById = async (req, res) => {
  const { id } = req.params;
  try {
    const show = await prisma.show.findUnique({
      where: { id: Number(id) },
      include: {
        movie: true,
        theatre: true,
        screen: true,
        bookings: true // Include bookings if needed
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

// Delete a show
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

    // Check if there are any bookings associated with this show
    const relatedBookingsCount = await prisma.booking.count({
      where: { showId: Number(id) },
    });

    if (relatedBookingsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete show with existing bookings. Consider cancelling/soft deleting bookings first.' });
    }

    await prisma.show.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({ message: 'Show deleted successfully.' });
  } catch (error) {
    console.error('Delete Show Error:', error);
    res.status(500).json({ error: 'Failed to delete show.' });
  }
};