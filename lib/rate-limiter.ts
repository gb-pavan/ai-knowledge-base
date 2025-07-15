import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter for API requests
export const apiLimiter = new RateLimiterMemory({
  keyPrefix: 'api',
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
});

// Rate limiter for chat requests
export const chatLimiter = new RateLimiterMemory({
  keyPrefix: 'chat',
  points: 5, // Number of chat requests
  duration: 60, // Per 60 seconds
});

// Rate limiter for auth requests
export const authLimiter = new RateLimiterMemory({
  keyPrefix: 'auth',
  points: 5, // Number of auth attempts
  duration: 300, // Per 5 minutes
});