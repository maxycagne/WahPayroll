import express from "express";
import { getMe, login, logout } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import refresh from "../helper/refresh.js";
// import userAgent from "../middleware/userAgent.js";
import authLimiter from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/login", authLimiter, login);
router.get("/me", authenticateToken, getMe);
router.post("/logout", authLimiter, logout);

router.post("/refresh", refresh);

export default router;
