import prisma from '../config/prisma.js';

export const createTheatre = async (req, res) => {
  const { name, location, totalSeats } = req.body;
  const ownerId = req.user.id; // Owner ID from authenticated request

  if (!name || !location || !totalSeats) {
    return res.status(400).json({ message: 'All fields (name, location, totalSeats) are required' });
  }
  if (Number(totalSeats) <= 0) {
      return res.status(400).json({ message: 'Total seats must be a positive number.' });
  }

  try {
    const theatre = await prisma.theatre.create({
      data: {
        name,
        location,
        totalSeats: Number(totalSeats),
        ownerId,
      },
    });
    res.status(201).json({ message: 'Theatre created', theatre });
  } catch (error) {
    console.error('Create Theatre Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllTheatres = async (req, res) => {
  try {
    const theatres = await prisma.theatre.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        screens: { // Include screens for a more complete theatre view
            select: { id: true, name: true, capacity: true },
            orderBy: { name: 'asc' }
        },
        shows: { // Optionally include some show data
            select: {
                id: true,
                showTime: true,
                movie: { select: { title: true } },
                screen: { select: { name: true } }
            },
            orderBy: { showTime: 'asc' },
            take: 5 // Limit the number of shows for brevity
        }
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json(theatres);
  } catch (error) {
    console.error('Get Theatres Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOwnerTheatres = async (req, res) => {
  const ownerId = req.user.id;

  try {
    // Fetch theatres owned by the current user, including related screens and shows for dashboard view
    const theatres = await prisma.theatre.findMany({
      where: { ownerId },
      include: {
        screens: {
            include: { seats: true }, // Include physical seats for screens
            orderBy: { name: 'asc' }
        },
        shows: {
            include: {
                movie: { select: { id: true, title: true, language: true, duration: true } },
                screen: { select: { id: true, name: true } },
                showSeats: { // Include the status of seats for each show
                    include: { seat: true },
                    orderBy: [{ seat: { seatRow: 'asc' } }, { seat: { seatColumn: 'asc' } }]
                },
                bookings: { // Include bookings for shows (optional, can be heavy)
                    select: { id: true, user: { select: { name: true } }, status: true, totalPrice: true }
                }
            },
            orderBy: { showTime: 'asc' }
        },
      },
      orderBy: { name: 'asc' }
    });
    res.status(200).json(theatres);
  } catch (error) {
    console.error('Owner Theatres Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTheatre = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  try {
    const theatre = await prisma.theatre.findUnique({ where: { id: Number(id) } });

    if (!theatre || theatre.ownerId !== ownerId) {
      return res.status(404).json({ message: 'Theatre not found or unauthorized.' });
    }

    // Prevent deletion if there are any screens or shows associated with this theatre
    const relatedScreensCount = await prisma.screen.count({ where: { theatreId: Number(id) } });
    const relatedShowsCount = await prisma.show.count({ where: { theatreId: Number(id) } });

    if (relatedScreensCount > 0) {
      return res.status(400).json({ message: 'Cannot delete theatre with existing screens. Delete all screens first.' });
    }
    if (relatedShowsCount > 0) {
      return res.status(400).json({ message: 'Cannot delete theatre with existing shows. Delete all shows first.' });
    }

    await prisma.theatre.delete({ where: { id: Number(id) } });

    res.status(200).json({ message: 'Theatre deleted successfully.' });
  } catch (error) {
    console.error('Delete Theatre Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};