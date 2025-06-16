// import prisma from '../config/prisma.js';

// export const createMovie = async (req, res) => {
//   const { title, description, duration, language, releaseDate, posterUrl } = req.body;

//   if (!title || !duration || !language || !releaseDate || !posterUrl) {
//     return res.status(400).json({ message: 'Missing required movie fields (title, duration, language, releaseDate, posterUrl).' });
//   }

//   try {
//     const movie = await prisma.movie.create({
//       data: {
//         title,
//         description,
//         duration: Number(duration),
//         language,
//         releaseDate: new Date(releaseDate), // Ensure date format is correct
//         posterUrl,
//       },
//     });

//     res.status(201).json({ message: 'Movie created', movie });
//   } catch (error) {
//     console.error('Create Movie Error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// export const getAllMovies = async (req, res) => {
//   try {
//     const movies = await prisma.movie.findMany({
//       orderBy: { releaseDate: 'desc' },
//     });
//     res.status(200).json(movies);
//   } catch (error) {
//     console.error('Get Movies Error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// export const getMovieById = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const movie = await prisma.movie.findUnique({
//       where: { id: Number(id) },
//     });

//     if (!movie) return res.status(404).json({ message: 'Movie not found' });

//     res.status(200).json(movie);
//   } catch (error) {
//     console.error('Get Movie Error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

import prisma from '../config/prisma.js';

export const createMovie = async (req, res) => {
  const { title, description, duration, language, releaseDate, posterUrl } = req.body;

  if (!title || !duration || !language || !releaseDate || !posterUrl) {
    return res.status(400).json({ message: 'Missing required movie fields (title, duration, language, releaseDate, posterUrl).' });
  }

  try {
    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        duration: Number(duration),
        language,
        releaseDate: new Date(releaseDate), // Ensure date format is correct
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

/**
 * @desc Deletes a movie by its ID.
 * @route DELETE /api/movies/:id
 * @access Private (assuming authentication middleware is used)
 */
export const deleteMovie = async (req, res) => {
  const { id } = req.params;

  try {
    const movie = await prisma.movie.delete({
      where: { id: Number(id) },
    });

    if (!movie) {
      // This case might not be hit directly by Prisma delete if ID doesn't exist,
      // as it would throw an error, but it's good for clarity.
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.status(200).json({ message: 'Movie deleted successfully', movie });
  } catch (error) {
    // P2025 is Prisma's error code for a record not found for a delete/update operation
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    console.error('Delete Movie Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * @desc Updates an existing movie by its ID.
 * @route PUT /api/movies/:id
 * @access Private (assuming authentication middleware is used)
 */
export const updateMovie = async (req, res) => {
  const { id } = req.params;
  const { title, description, duration, language, releaseDate, posterUrl } = req.body;

  // Optional: Add validation for incoming movieData if specific fields are required for an update
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'No update data provided.' });
  }

  try {
    const movie = await prisma.movie.update({
      where: { id: Number(id) },
      data: {
        // Only update fields if they are provided in the request body
        title: title || undefined,
        description: description || undefined,
        duration: duration ? Number(duration) : undefined,
        language: language || undefined,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        posterUrl: posterUrl || undefined,
      },
    });

    res.status(200).json({ message: 'Movie updated successfully', movie });
  } catch (error) {
    // P2025 is Prisma's error code for a record not found for a delete/update operation
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    console.error('Update Movie Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
