import { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const message = 'Too many attempts. Please try again later.';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => {
    const ip = req.ip ? ipKeyGenerator(req.ip) : String(req.headers['x-forwarded-for'] || '');
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    return email ? `${ip}-${email}` : ip;
  },
  handler: (_req, res) => {
    void _req;
    res.status(429).json({ error: 'RATE_LIMITED', message });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (_req, res) => {
    void _req;
    res.status(429).json({ error: 'RATE_LIMITED', message });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
