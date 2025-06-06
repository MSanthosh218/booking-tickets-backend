// src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import all your existing routes
import authRoutes from './routes/auth.routes.js';
import theatreRoutes from './routes/theatre.routes.js';
import movieRoutes from './routes/movie.routes.js';
import bookingRoutes from "./routes/bookingRoutes.js";
import screenRoutes from "./routes/screen.routes.js";
import showRoutes from "./routes/show.routes.js";
import userRoutes from "./routes/user.routes.js"; // <--- ADD THIS LINE: Import the new user routes

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
app.use("/api/screens", screenRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/users", userRoutes); // <--- ADD THIS LINE: Tell Express to use user routes for /api/users

export default app;