import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many requests, please try again later.",
    retryAfter: "10 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res, next, options) => {
    console.log(` IP ${req.ip} exceeded the maximum login attempts.`);
    res.status(options.statusCode).json(options.message);
  },
});

export default authLimiter;
