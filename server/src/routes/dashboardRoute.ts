import express from "express";
import {
  getDashboardSummary,
  getMyAttendance,
  getOffsetApplications,
  getAllEmployees,
  getAllPayroll,
  getAttendanceCalendarSummary,
  updateLeaveStatus,
  getResignations,
  getAllLeaves,
} from "../controllers/dashboardController";
import {
  authenticateToken,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/dashboard-summary",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getDashboardSummary,
);

router.get(
  "/my-attendance",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getMyAttendance,
);

router.get(
  "/offset-applications",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getOffsetApplications,
);

router.get(
  "/attendance-summary",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getAttendanceCalendarSummary,
);

router.get(
  "/resignations",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getResignations,
);

router.get(
  "/leaves",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getAllLeaves,
);

router.put(
  "/leaves/:id",
  authorizeRoles("Supervisor", "HR"),
  updateLeaveStatus,
);

router.get(
  "/payroll",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getAllPayroll,
);

router.get("/", authorizeRoles("Admin", "Supervisor", "HR"), getAllEmployees);

export default router;
