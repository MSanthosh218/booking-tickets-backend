// src/controllers/movie.controller.js
import prisma from '../config/prisma.js';

export const createMovie = async (req, res) => {
  const { title, description, duration, language, releaseDate, posterUrl } = req.body;

  if (!title || !duration || !language || !releaseDate || !posterUrl) {
    return res.status(400).json({ message: 'Missing required movie fields' });
  }

  try {
    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        duration: Number(duration),
        language,
        releaseDate: new Date(releaseDate),
        posterUrl,
      },
    });

    res.status(201).json({ message: 'Movie created', movie });
  } catch (error) {
    console.error('Create Movie Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllMovies = async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { releaseDate: 'desc' },
    });
    res.status(200).json(movies);
  } catch (error) {
    console.error('Get Movies Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMovieById = async (req, res) => {
  const { id } = req.params;

  try {
    const movie = await prisma.movie.findUnique({
      where: { id: Number(id) },
    });

    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    res.status(200).json(movie);
  } catch (error) {
    console.error('Get Movie Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
