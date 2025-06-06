import prisma from '../config/prisma.js';

// Create a new screen for a theatre and automatically generate its seats
export const createScreen = async (req, res) => {
  const { name, capacity, theatreId } = req.body;
  const userId = req.user.id; // User making the request (owner or admin)

  if (!name || !capacity || !theatreId) {
    return res.status(400).json({ error: 'Name, capacity, and theatreId are required.' });
  }
  if (Number(capacity) <= 0) {
      return res.status(400).json({ error: 'Capacity must be a positive number.' });
  }

  try {
    // Validate theatre existence
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

    // Use a Prisma transaction to ensure screen creation and seat generation are atomic
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create the screen
      const screen = await prisma.screen.create({
        data: {
          name,
          capacity: Number(capacity),
          theatreId: Number(theatreId),
        },
      });

      // 2. Automatically generate physical seats for the new screen
      const seatsToCreate = [];
      // Simple heuristic: divide capacity into rows, assume 10 seats per row
      // You might have a more complex seat layout logic here in a real app
      const numRows = Math.ceil(Number(capacity) / 10);
      let seatCounter = 1;

      for (let i = 0; i < numRows; i++) {
        const rowChar = String.fromCharCode(65 + i); // 'A', 'B', 'C', ...
        for (let j = 1; j <= 10 && seatCounter <= Number(capacity); j++) {
          seatsToCreate.push({
            screenId: screen.id,
            seatRow: rowChar,
            seatColumn: j,
            seatType: 'Standard' // Default seat type, can be expanded
          });
          seatCounter++;
        }
      }

      // Create the seats in bulk
      if (seatsToCreate.length > 0) {
        await prisma.seat.createMany({
          data: seatsToCreate,
        });
      }
      return screen;
    });

    res.status(201).json({ message: 'Screen and its seats created successfully', screen: result });
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
        seats: { // Optionally include the physical seats for each screen
            orderBy: [{ seatRow: 'asc' }, { seatColumn: 'asc' }]
        }
      },
      orderBy: { name: 'asc' } // Order screens by name
    });
    res.status(200).json(screens);
  } catch (error) {
    console.error('Get Screens by Theatre Error:', error);
    res.status(500).json({ error: 'Failed to retrieve screens.' });
  }
};

// Get a single screen by ID (including its physical seats)
export const getScreenById = async (req, res) => {
  const { id } = req.params;
  try {
    const screen = await prisma.screen.findUnique({
      where: { id: Number(id) },
      include: {
        theatre: true,
        seats: { // Include the actual seat layout for this screen
            orderBy: [{ seatRow: 'asc' }, { seatColumn: 'asc' }]
        }
      },
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
  const { name, capacity, theatreId } = req.body; // theatreId rarely changes
  const userId = req.user.id;

  try {
    const screen = await prisma.screen.findUnique({ where: { id: Number(id) } });
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found.' });
    }

    // Ensure the theatre belongs to the authenticated owner/admin
    const theatre = await prisma.theatre.findUnique({ where: { id: screen.theatreId } });
    if (req.user.role === 'OWNER' && theatre.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this theatre.' });
    }

    const updatedScreen = await prisma.screen.update({
      where: { id: Number(id) },
      data: {
        name: name || screen.name,
        capacity: capacity ? Number(capacity) : screen.capacity,
        // If capacity changes, you might need more complex logic to add/remove seats.
        // For simplicity, we are not automating seat changes here based on capacity updates.
        theatreId: theatreId ? Number(theatreId) : screen.theatreId,
      },
    });
    res.status(200).json({ message: 'Screen updated successfully', updatedScreen });
  } catch (error) {
    console.error('Update Screen Error:', error);
    res.status(500).json({ error: 'Failed to update screen.' });
  }
};

// Delete a screen (also deletes associated physical seats, but prevents deletion if shows exist)
export const deleteScreen = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const screen = await prisma.screen.findUnique({ where: { id: Number(id) } });
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found.' });
    }

    // Ensure the theatre belongs to the authenticated owner/admin
    const theatre = await prisma.theatre.findUnique({ where: { id: screen.theatreId } });
    if (req.user.role === 'OWNER' && theatre.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this theatre.' });
    }

    // Prevent deletion if there are any shows associated with this screen
    const relatedShowsCount = await prisma.show.count({
      where: { screenId: Number(id) },
    });

    if (relatedShowsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete screen with existing shows. Delete all associated shows first.' });
    }

    // Use a transaction to delete screen and its associated physical seats atomically
    await prisma.$transaction(async (prisma) => {
        // Delete all physical seats belonging to this screen
        await prisma.seat.deleteMany({
            where: { screenId: Number(id) }
        });

        // Finally, delete the screen itself
        await prisma.screen.delete({
            where: { id: Number(id) },
        });
    });

    res.status(200).json({ message: 'Screen and its associated seats deleted successfully.' });
  } catch (error) {
    console.error('Delete Screen Error:', error);
    res.status(500).json({ error: 'Failed to delete screen.' });
  }
};