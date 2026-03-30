import { Router } from "express";
import { getAttendeesCount } from "../controllers/hrReportsController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();
router.use(authenticateToken);
router.get("/attendance-count", getAttendeesCount);

export default router;
