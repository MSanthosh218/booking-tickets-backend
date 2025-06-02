// src/controllers/screen.controller.js
import prisma from '../config/prisma.js';

// Create a new screen for a theatre
export const createScreen = async (req, res) => {
  const { name, capacity, theatreId } = req.body;
  const userId = req.user.id; // User making the request (owner or admin)

  if (!name || !capacity || !theatreId) {
    return res.status(400).json({ error: 'Name, capacity, and theatreId are required.' });
  }

  try {
    const theatre = await prisma.theatre.findUnique({
      where: { id: theatreId },
    });

    if (!theatre) {
      return res.status(404).json({ error: 'Theatre not found.' });
    }

    // If user is OWNER, ensure they own this theatre
    if (req.user.role === 'OWNER' && theatre.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this theatre.' });
    }

    const screen = await prisma.screen.create({
      data: {
        name,
        capacity: Number(capacity),
        theatreId: Number(theatreId),
      },
    });
    res.status(201).json({ message: 'Screen created successfully', screen });
  } catch (error) {
    console.error('Create Screen Error:', error);
    res.status(500).json({ error: 'Failed to create screen.' });
  }
};

// Get all screens for a specific theatre
export const getScreensByTheatre = async (req, res) => {
  const { theatreId } = req.params;

  try {
    const screens = await prisma.screen.findMany({
      where: { theatreId: Number(theatreId) },
      include: {
        theatre: {
          select: { id: true, name: true, location: true },
        },
      },
    });
    res.status(200).json(screens);
  } catch (error) {
    console.error('Get Screens by Theatre Error:', error);
    res.status(500).json({ error: 'Failed to retrieve screens.' });
  }
};

// Get a single screen by ID
export const getScreenById = async (req, res) => {
  const { id } = req.params;
  try {
    const screen = await prisma.screen.findUnique({
      where: { id: Number(id) },
      include: { theatre: true },
    });
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found.' });
    }
    res.status(200).json(screen);
  } catch (error) {
    console.error('Get Screen By ID Error:', error);
    res.status(500).json({ error: 'Failed to retrieve screen.' });
  }
};

// Update a screen
export const updateScreen = async (req, res) => {
  const { id } = req.params;
  const { name, capacity, theatreId } = req.body;
  const userId = req.user.id;

  try {
    const screen = await prisma.screen.findUnique({ where: { id: Number(id) } });
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found.' });
    }

    const theatre = await prisma.theatre.findUnique({ where: { id: screen.theatreId } });
    if (req.user.role === 'OWNER' && theatre.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this theatre.' });
    }

    const updatedScreen = await prisma.screen.update({
      where: { id: Number(id) },
      data: {
        name: name || screen.name,
        capacity: capacity ? Number(capacity) : screen.capacity,
        // theatreId is usually not changed after creation, but included for completeness
        theatreId: theatreId ? Number(theatreId) : screen.theatreId,
      },
    });
    res.status(200).json({ message: 'Screen updated successfully', updatedScreen });
  } catch (error) {
    console.error('Update Screen Error:', error);
    res.status(500).json({ error: 'Failed to update screen.' });
  }
};

// Delete a screen
export const deleteScreen = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const screen = await prisma.screen.findUnique({ where: { id: Number(id) } });
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found.' });
    }

    const theatre = await prisma.theatre.findUnique({ where: { id: screen.theatreId } });
    if (req.user.role === 'OWNER' && theatre.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this theatre.' });
    }

    // Check if there are any shows associated with this screen
    const relatedShowsCount = await prisma.show.count({
      where: { screenId: Number(id) },
    });

    if (relatedShowsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete screen with existing shows.' });
    }

    await prisma.screen.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({ message: 'Screen deleted successfully.' });
  } catch (error) {
    console.error('Delete Screen Error:', error);
    res.status(500).json({ error: 'Failed to delete screen.' });
  }
};