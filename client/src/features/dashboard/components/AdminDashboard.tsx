import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  Clock3,
  FileClock,
  HandCoins,
  UserMinus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";

import Employees from "@/pages/Employees";
import Attendance from "@/pages/Attendance";
import Payroll from "@/pages/Payroll";

import { User } from "../types";
import {
  getDashboardSummary,
  getAllEmployees,
  getPayroll,
  getAttendanceSummary,
  updateLeaveStatus,
} from "../api";
import { DashboardLegend } from "./DashboardLegend";
import { AttendanceTooltip, PayrollTooltip } from "./DashboardTooltips";
import { ApprovalsModal } from "./ApprovalsModal";
import { ReviewLeaveModal } from "./ReviewLeaveModal";

import { workweekConfigQueryOptions } from "@/features/leave/utils/query.utils";
import { getWorkingDateRangeInclusive } from "@/features/leave/utils/date.utils";

interface AdminDashboardProps {
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
}) => {
  const queryClient = useQueryClient();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [approvedLeaves, setApprovedLeaves] = useState<Set<any>>(new Set());
  const [reviewConfirm, setReviewConfirm] = useState<any>(null);
  const [quickActionHost, setQuickActionHost] = useState<string | null>(null);
  const [quickActionSeed, setQuickActionSeed] = useState(0);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const [year, month] = useMemo(() => period.split("-").map(Number), [period]);

  const dashboardQuery = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: getDashboardSummary,
  });

  const employeesQuery = useQuery({
    queryKey: ["dashboard-employees"],
    queryFn: getAllEmployees,
  });

  const { data: workweekConfigs = [] } = useQuery(workweekConfigQueryOptions);

  const payrollQuery = useQuery({
    queryKey: ["dashboard-payroll", period],
    queryFn: () => getPayroll(period),
  });

  const attendanceSummaryQuery = useQuery({
    queryKey: ["dashboard-attendance-summary", year, month],
    queryFn: () => getAttendanceSummary(year, month),
  });

  const employeesData = employeesQuery.data?.data || employeesQuery.data || [];
  const payrollData = payrollQuery.data?.data || payrollQuery.data || [];
  const attendanceSummary = attendanceSummaryQuery.data || [];

  const activeEmployeeCount = useMemo(() => 
    employeesData.filter(
      (e: any) =>
        String(e.status || "").toLowerCase() !== "inactive" &&
        String(e.role || "").toLowerCase() !== "admin"
    ).length,
    [employeesData]
  );

  const pendingLeaveCount = dashboardQuery.data?.pendingLeaves?.length || 0;
  const onLeaveCount = dashboardQuery.data?.onLeave?.length || 0;
  const absentsCount = dashboardQuery.data?.absents?.length || 0;
  const pendingResignationCount =
    dashboardQuery.data?.resignations?.length || 0;

  const payrollTotals = useMemo(() => 
    (payrollData as any[]).reduce(
      (acc, row) => {
        acc.gross += Number(row.gross_pay || 0);
        acc.net += Number(row.net_pay || 0);
        acc.deductions += Number(row.absence_deductions || 0);
        return acc;
      },
      { gross: 0, net: 0, deductions: 0 }
    ),
    [payrollData]
  );

  const attendanceTotals = useMemo(() => 
    (attendanceSummary as any[]).reduce(
      (acc, item) => {
        acc.present += Number(item.present_count || 0);
        acc.absent += Number(item.absent_count || 0);
        acc.late += Number(item.late_count || 0);
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    ),
    [attendanceSummary]
  );

  const attendanceChartData = useMemo(() => 
    (attendanceSummary as any[])
      .map((item) => ({
        day: String(item.formatted_date || item.date || "").slice(8, 10),
        Present: Number(item.present_count || 0),
        Absent: Number(item.absent_count || 0),
        Late: Number(item.late_count || 0),
      }))
      .sort((a, b) => Number(a.day) - Number(b.day)),
    [attendanceSummary]
  );

  const payrollChartData = useMemo(() => 
    [...(payrollData as any[])]
      .sort((a, b) => Number(b.net_pay || 0) - Number(a.net_pay || 0))
      .slice(0, 8)
      .map((row) => ({
        employee: `${row.emp_id}`,
        Net: Number(row.net_pay || 0),
        Gross: Number(row.gross_pay || 0),
      })),
    [payrollData]
  );

  const quickActions = useMemo(() => [
    {
      label: "Add Employee",
      sub: "Open Add Employee modal",
      action: "add-employee",
      icon: <Users className="h-4 w-4" />,
      color: "bg-blue-50 border-blue-200 text-blue-800",
    },
    {
      label: "Take Attendance",
      sub: "Open attendance modal",
      action: "take-attendance",
      icon: <Clock3 className="h-4 w-4" />,
      color: "bg-emerald-50 border-emerald-200 text-emerald-800",
    },
    {
      label: "Salary Settings",
      sub: "Open Position Salary Settings",
      action: "salary-settings",
      icon: <HandCoins className="h-4 w-4" />,
      color: "bg-purple-50 border-purple-200 text-purple-800",
    },
  ], []);

  const cards = useMemo(() => [
    {
      label: "Active Employees",
      value: activeEmployeeCount,
      borderColor: "#0f766e",
      icon: <Users className="h-4 w-4" />,
      clickable: false,
      modalKey: "",
    },
    {
      label: "Pending Approvals",
      value: pendingLeaveCount + pendingResignationCount,
      borderColor: "#7c3aed",
      icon: <FileClock className="h-4 w-4" />,
      clickable: true,
      modalKey: "pending",
    },
    {
      label: "On Leave",
      value: onLeaveCount,
      borderColor: "#d4a017",
      icon: <Briefcase className="h-4 w-4" />,
      clickable: true,
      modalKey: "leave",
    },
    {
      label: "Absent",
      value: absentsCount,
      borderColor: "#c0392b",
      icon: <UserMinus className="h-4 w-4" />,
      clickable: true,
      modalKey: "absent",
    },
  ], [activeEmployeeCount, pendingLeaveCount, pendingResignationCount, onLeaveCount, absentsCount]);

  const handleUpdateLeaveStatus = useCallback(async (id: string | number, payload: any) => {
    try {
      const res = await updateLeaveStatus(id, payload);

      if (res.status <= 201) {
        setApprovedLeaves(prev => new Set([...Array.from(prev), id]));
        queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      } else {
        alert("Failed to update leave request");
      }
    } catch (error) {x
      console.error("Error updating leave:", error);
    }
  }, [queryClient]);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setApprovedLeaves(new Set());
  }, []);

  const openQuickAction = useCallback((action: any) => {
    setQuickActionSeed((prev) => prev + 1);

    if (action.action === "add-employee") {
      setQuickActionHost("employees");
      return;
    }

    if (action.action === "take-attendance") {
      setQuickActionHost("attendance");
      return;
    }

    if (action.action === "salary-settings") {
      setQuickActionHost("payroll");
    }
  }, []);

  const openLeaveDecisionConfirm = useCallback((employee: any) => {
    const requestedDates = getWorkingDateRangeInclusive(
      employee.date_from,
      employee.date_to,
      workweekConfigs
    );
    const totalDays = requestedDates.length;

    setReviewConfirm({
      employee,
      status: null,
      totalDays,
      isMultiDay: totalDays > 1,
      selectedDates: requestedDates,
      remarks: "",
    });
  }, [workweekConfigs]);

  const toggleApprovedDate = useCallback((date: string) => {
    setReviewConfirm(prev => {
      if (!prev) return prev;
      const selected = new Set(prev.selectedDates || []);
      if (selected.has(date)) {
        selected.delete(date);
      } else {
        selected.add(date);
      }
      return {
        ...prev,
        selectedDates: Array.from(selected).sort(),
      };
    });
  }, []);

  const submitLeaveDecision = useCallback(async () => {
    if (!reviewConfirm) return;

    if (!reviewConfirm.status) {
      alert("Select Approve or Deny after reviewing the request.");
      return;
    }

    const trimmedRemarks = String(reviewConfirm.remarks || "").trim();
    const isDenyDecision = reviewConfirm.status === "Denied";

    if (isDenyDecision && !trimmedRemarks) {
      alert("Reason is required for denial.");
      return;
    }

    if (reviewConfirm.status === "Denied") {
      await handleUpdateLeaveStatus(reviewConfirm.employee.id, {
        status: "Denied",
        supervisor_remarks: trimmedRemarks,
      });
      setReviewConfirm(null);
      return;
    }

    const requestedDates = getWorkingDateRangeInclusive(
      reviewConfirm.employee.date_from,
      reviewConfirm.employee.date_to,
      workweekConfigs
    );
    const selectedDates = reviewConfirm.selectedDates || [];

    if (selectedDates.length === 0) {
      alert("Select at least one day to approve.");
      return;
    }

    const isPartial =
      reviewConfirm.isMultiDay && selectedDates.length < requestedDates.length;

    await handleUpdateLeaveStatus(reviewConfirm.employee.id, {
      status: isPartial ? "Partially Approved" : "Approved",
      approved_days: selectedDates.length,
      approved_dates: selectedDates,
      supervisor_remarks: undefined,
    });
    setReviewConfirm(null);
  }, [reviewConfirm, workweekConfigs, handleUpdateLeaveStatus]);

  if (
    dashboardQuery.isLoading ||
    employeesQuery.isLoading ||
    payrollQuery.isLoading ||
    attendanceSummaryQuery.isLoading
  )
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 font-semibold text-slate-700 shadow-sm">
        Loading Dashboard...
      </div>
    );

  return (
    <div className="max-w-full space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="m-0 text-[1.3rem] font-bold text-slate-900">
              Admin Command Center
            </h1>
            <p className="m-0 mt-0.5 text-xs text-slate-500">
              Central overview for people, attendance, leave, payroll, and
              approvals.
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition-all duration-200 hover:border-violet-300 hover:bg-violet-50">
            Payroll Period
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => c.clickable && setActiveModal(c.modalKey)}
            disabled={!c.clickable}
            className={`group relative rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 ${
              c.clickable
                ? "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
                : "cursor-default"
            }`}
            style={{ boxShadow: `inset 0 3px 0 0 ${c.borderColor}` }}
          >
            <div className="p-3.5 text-left">
              <p className="m-0 mb-1 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <span style={{ color: c.borderColor }}>{c.icon}</span>
                {c.label}
              </p>
              <p className="m-0 mb-1 text-[11px] font-medium text-slate-600">
                {c.label === "Pending Approvals"
                  ? `${pendingLeaveCount} leaves + ${pendingResignationCount} resignations`
                  : c.label === "Absent"
                    ? `${attendanceTotals.absent} attendance absences in ${period}`
                    : c.label === "On Leave"
                      ? `${onLeaveCount} currently on leave`
                      : "Total active profiles"}
              </p>
              <p
                className="m-0 text-2xl font-black"
                style={{ color: c.borderColor }}
              >
                {c.value}
              </p>
              {c.clickable && (
                <p className="m-0 mt-1 text-[10px] text-slate-400 transition-colors group-hover:text-slate-500">
                  Click to view
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Total Gross Payroll
          </p>
          <p className="m-0 mt-1 text-xl font-black text-emerald-800">
            ₱
            {payrollTotals.gross.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-sky-700">
            Total Net Payroll
          </p>
          <p className="m-0 mt-1 text-xl font-black text-sky-800">
            ₱
            {payrollTotals.net.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-rose-700">
            Total Deductions
          </p>
          <p className="m-0 mt-1 text-xl font-black text-rose-800">
            ₱
            {payrollTotals.deductions.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="m-0 text-sm font-bold text-slate-900">
            Quick Actions
          </h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Core Modules
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.action}
              onClick={() => openQuickAction(action)}
              className={`group rounded-lg border p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${action.color}`}
            >
              <span className="inline-flex items-center gap-2 text-xs font-bold">
                {action.icon}
                {action.label}
              </span>
              <p className="m-0 mt-1 text-[11px] text-slate-600">
                {action.sub}
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                Open
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {quickActionHost === "employees" && (
        <Employees key={`qa-employees-${quickActionSeed}`} shortcutMode />
      )}
      {quickActionHost === "attendance" && (
        <Attendance key={`qa-attendance-${quickActionSeed}`} shortcutMode />
      )}
      {quickActionHost === "payroll" && (
        <Payroll key={`qa-payroll-${quickActionSeed}`} shortcutMode />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <h3 className="m-0 text-sm font-bold text-slate-900">
            Attendance Overview ({period})
          </h3>
          <p className="m-0 mt-1 text-[11px] text-slate-500">
            Daily present, absent, and late counts for the selected month.
          </p>
          <div className="mt-3 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  content={<AttendanceTooltip />}
                  cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
                />
                <DashboardLegend />
                <Line
                  type="monotone"
                  dataKey="Present"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Absent"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Late"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <h3 className="m-0 text-sm font-bold text-slate-900">
            Payroll Snapshot ({period})
          </h3>
          <p className="m-0 mt-1 text-[11px] text-slate-500">
            Top employees by net pay for the selected payroll period.
          </p>
          <div className="mt-3 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis dataKey="employee" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₱${Math.round(v / 1000)}k`}
                />
                <RechartsTooltip
                  content={<PayrollTooltip />}
                  cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                />
                <DashboardLegend />
                <Bar dataKey="Gross" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {activeModal && (
        <ApprovalsModal
          activeModal={activeModal}
          dashboardData={dashboardQuery.data}
          closeModal={closeModal}
          approvedLeaves={approvedLeaves}
          openLeaveDecisionConfirm={openLeaveDecisionConfirm}
          attendanceTotals={attendanceTotals}
          period={period}
          pendingLeaveCount={pendingLeaveCount}
          pendingResignationCount={pendingResignationCount}
          onLeaveCount={onLeaveCount}
        />
      )}

      {reviewConfirm && (
        <ReviewLeaveModal
          reviewConfirm={reviewConfirm}
          workweekConfigs={workweekConfigs}
          setReviewConfirm={setReviewConfirm}
          submitLeaveDecision={submitLeaveDecision}
          toggleApprovedDate={toggleApprovedDate}
        />
      )}
    </div>
  );
};
