// src/controllers/theatre.controller.js
import prisma from '../config/prisma.js';

export const createTheatre = async (req, res) => {
  const { name, location, totalSeats } = req.body;
  const ownerId = req.user.id;

  if (!name || !location || !totalSeats) {
    return res.status(400).json({ message: 'All fields are required' });
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
      },
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
    const theatres = await prisma.theatre.findMany({
      where: { ownerId },
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
      return res.status(404).json({ message: 'Theatre not found or unauthorized' });
    }

    await prisma.theatre.delete({ where: { id: Number(id) } });

    res.status(200).json({ message: 'Theatre deleted' });
  } catch (error) {
    console.error('Delete Theatre Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
