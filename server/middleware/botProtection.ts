import { Request, Response, NextFunction } from 'express';

// Basic bot protection - check for common bot user agents
export const botProtection = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // List of known bot user agents
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /postman/i,
    /insomnia/i,
  ];
  
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));
  
  // Allow bots for certain endpoints (like health checks)
  const allowedPaths = ['/health', '/api/health'];
  const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));
  
  if (isBot && !isAllowedPath) {
    // Still allow but log it
    console.warn('Bot detected:', userAgent, req.path);
    // Don't block, just track
  }
  
  next();
};

// Check for suspicious activity patterns
export const suspiciousActivityCheck = async (req: Request, res: Response, next: NextFunction) => {
  // This is a placeholder - can be enhanced with actual pattern detection
  // For now, rate limiting handles most of this
  
  next();
};

