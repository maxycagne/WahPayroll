import express from "express";
import {
  getAttendance,
  getAttendanceStats,
  getDailyAttendance,
  saveBulkAttendance,
  adjustLeaveBalance,
  getWorkweekConfigs,
  upsertWorkweekConfig,
  updateWorkweekConfigById,
  deleteWorkweekConfigById,
} from "../controllers/attendanceController";
import {
  authenticateToken,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/attendance",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getAttendance,
);

router.get(
  "/attendance-stats",
  authorizeRoles("Admin", "HR"),
  getAttendanceStats,
);

router.get(
  "/attendance-daily",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getDailyAttendance,
);

router.post(
  "/attendance-bulk",
  authorizeRoles("Admin", "HR"),
  saveBulkAttendance,
);

router.put(
  "/leave-balance/:id",
  authorizeRoles("HR"),
  adjustLeaveBalance,
);

router.get(
  "/workweek-config",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getWorkweekConfigs,
);

router.post(
  "/workweek-config",
  authorizeRoles("Admin"),
  upsertWorkweekConfig,
);

router.put(
  "/workweek-config/:id",
  authorizeRoles("Admin"),
  updateWorkweekConfigById,
);

router.delete(
  "/workweek-config/:id",
  authorizeRoles("Admin"),
  deleteWorkweekConfigById,
);

export default router;
