import express, { Router } from "express";
import { register, getPendingRequests, approveRequest, rejectRequest } from "../controllers/registerController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router: Router = express.Router();

// Public registration
router.post("/", register);

// Protected approval endpoints
router.get("/requests", authenticateToken, getPendingRequests);
router.put("/approve/:id", authenticateToken, approveRequest);
router.put("/reject/:id", authenticateToken, rejectRequest);

export default router;
