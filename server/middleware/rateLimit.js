import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for generation endpoints
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 generations per hour per IP
  message: 'Too many generation requests. Please wait before generating more.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Game score submission limiter
export const gameLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit to 10 score submissions per minute
  message: 'Too many score submissions. Please wait a moment.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Calendar/giveaway limiter
export const actionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit to 20 actions per minute
  message: 'Too many actions. Please wait a moment.',
  standardHeaders: true,
  legacyHeaders: false,
});

