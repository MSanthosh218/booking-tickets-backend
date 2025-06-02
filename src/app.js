
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import theatreRoutes from './routes/theatre.routes.js';
import movieRoutes from './routes/movie.routes.js';
import bookingRoutes from "./routes/bookingRoutes.js";
import screenRoutes from "./routes/screen.routes.js"; // NEW
import showRoutes from "./routes/show.routes.js";     // NEW


dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/screens", screenRoutes); // NEW
app.use("/api/shows", showRoutes);     // NEW

export default app;