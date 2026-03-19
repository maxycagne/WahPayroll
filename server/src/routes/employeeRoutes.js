import express from "express";
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllLeaves,
  updateLeaveStatus,
  fileLeave,
  getAllPayroll,
  getAttendance,
  adjustLeaveBalance,
  getDashboardSummary,
  getSalaryHistory,
  applySalaryAdjustment,
  updateBaseSalaryByPosition,
  getAttendanceCalendarSummary,
  getDailyAttendance,
  saveBulkAttendance,
} from "../controllers/employeeController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

// --- Dashboard ---
router.get(
  "/dashboard-summary",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getDashboardSummary,
);

// --- Attendance & Calendar ---
router.get(
  "/attendance",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getAttendance,
);
router.put(
  "/leave-balance/:id",
  authorizeRoles("Admin", "Supervisor", "HR"),
  adjustLeaveBalance,
);
router.get(
  "/attendance-summary",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getAttendanceCalendarSummary,
);
router.get(
  "/attendance-daily",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getDailyAttendance,
);
router.post(
  "/attendance-bulk",
  authorizeRoles("Admin", "Supervisor", "HR"),
  saveBulkAttendance,
);

// --- Leaves ---
router.get(
  "/leaves",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getAllLeaves,
);
router.post(
  "/leaves",
  authorizeRoles("Supervisor", "HR", "RankAndFile"),
  fileLeave,
);
router.put(
  "/leaves/:id",
  authorizeRoles("Admin", "Supervisor"),
  updateLeaveStatus,
);

// --- Payroll & Salary ---
router.get(
  "/payroll",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getAllPayroll,
);
router.post(
  "/salary-adjustment",
  authorizeRoles("Admin", "Supervisor"),
  applySalaryAdjustment,
);
router.put(
  "/update-base-salary",
  authorizeRoles("Admin", "Supervisor"),
  updateBaseSalaryByPosition,
);
router.get(
  "/salary-history/:emp_id",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getSalaryHistory,
);

// --- Employees ---
router.get("/", authorizeRoles("Admin", "Supervisor", "HR"), getAllEmployees);
router.post("/", authorizeRoles("Admin", "HR"), createEmployee);
router.put("/:id", authorizeRoles("Admin", "HR"), updateEmployee);
router.delete("/:id", authorizeRoles("Admin"), deleteEmployee);

export default router;
