import express from "express";
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  deleteEmployee,
  getAllLeaves,
  updateLeaveStatus,
  fileLeave,
  getAllPayroll,
  generatePayroll,
  getAttendance,
  adjustLeaveBalance,
  getDashboardSummary,
  getSalaryHistory,
  applySalaryAdjustment,
  updateBaseSalaryByPosition,
  getAttendanceCalendarSummary,
  getDailyAttendance,
  getAllResignations,
  saveBulkAttendance,
  getWorkweekConfigs,
  upsertWorkweekConfig,
  updateWorkweekConfigById,
  deleteWorkweekConfigById,
  getOffsetBalance,
  fileOffsetApplication,
  getOffsetApplications,
  updateOffsetApplicationStatus,
  getPayrollReports,
  getMyAttendance,
  updateMissingDocs,
  getMyResignations,
  getResignations,
  fileResignation,
  updateResignationStatus,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/employeeController.js";
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

router.post("/missing-docs", authorizeRoles("Admin", "HR"), updateMissingDocs);

router.get(
  "/my-attendance",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getMyAttendance,
);
router.get(
  "/attendance",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getAttendance,
);

router.get("/all-resignations", getAllResignations);
router.get(
  "/my-resignations",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getMyResignations,
);
router.get(
  "/resignations",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getResignations,
);
router.post(
  "/resignations",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  fileResignation,
);
router.put(
  "/resignations/:id",
  authorizeRoles("Admin", "Supervisor"),
  updateResignationStatus,
);

router.get(
  "/notifications",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getMyNotifications,
);
router.put(
  "/notifications/:id/read",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  markNotificationRead,
);
router.put(
  "/notifications/read-all",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  markAllNotificationsRead,
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

router.get(
  "/workweek-config",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getWorkweekConfigs,
);
router.post("/workweek-config", authorizeRoles("Admin"), upsertWorkweekConfig);
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

router.put(
  "/resignations/:id",
  authorizeRoles("Admin", "Supervisor", "HR"),
  updateResignationStatus,
);

router.get(
  "/offset-balance/:emp_id",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getOffsetBalance,
);
router.post(
  "/offset-applications",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  fileOffsetApplication,
);
router.get(
  "/offset-applications",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getOffsetApplications,
);
router.put(
  "/offset-applications/:id",
  authorizeRoles("Admin", "Supervisor"),
  updateOffsetApplicationStatus,
);

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

router.get(
  "/payroll",
  authorizeRoles("Admin", "Supervisor", "HR", "RankAndFile"),
  getAllPayroll,
);
router.post(
  "/generate-payroll",
  authorizeRoles("Admin", "Supervisor"),
  generatePayroll,
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

router.get(
  "/payroll-reports",
  authorizeRoles("Admin", "Supervisor", "HR"),
  getPayrollReports,
);

router.get("/", authorizeRoles("Admin", "Supervisor", "HR"), getAllEmployees);
router.post("/", authorizeRoles("Admin", "HR"), createEmployee);
router.put("/:id", authorizeRoles("Admin", "HR"), updateEmployee);
router.put(
  "/:id/reset-password",
  authorizeRoles("Admin"),
  resetEmployeePassword,
);
router.delete("/:id", authorizeRoles("Admin"), deleteEmployee);

export default router;
