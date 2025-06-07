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
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

// Middlewares
// app.use(cors());
app.use(cors({
  credentials : true,
  origin : process.env.FRONTEND_URL
})) 
app.use(express.json()); // Essential for parsing JSON request bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/screens", screenRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/users", userRoutes);

// --- Error Handling Middleware ---
// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error('API Route not found');
  error.status = 404;
  next(error);
});

// General error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    // Only send stack trace in development mode
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;