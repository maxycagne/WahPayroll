import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import Toast, { TOAST_DURATION_LONG } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import axiosInterceptor from "../hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import { Mail, FileDown } from "lucide-react";
import PayrollSummaryDoc from "../components/pdfTemps/PayrollSummaryDoc";

const DEFAULT_DEDUCTION_TYPES = [
  "CAP",
  "SSS Loan",
  "Pag-IBIG Loan",
  "Cash Advance",
  "Others",
];

const DEFAULT_INCENTIVE_TYPES = [
  "Performance",
  "Attendance",
  "Project",
  "Others",
];

const toUiAdjustmentCategory = (rawType) => {
  const normalized = String(rawType || "")
    .trim()
    .toLowerCase();

  if (["decrease", "deduction", "deductions"].includes(normalized)) {
    return "Decrease";
  }

  return "Incentive";
};

const fmt = (n) => {
  const num = Number(n);
  return isNaN(num)
    ? "₱0.00"
    : "₱" +
        num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
};

const fmtSigned = (n) => {
  const num = Number(n || 0);
  if (isNaN(num)) return "+₱0.00";
  return `${num >= 0 ? "+" : "-"}${fmt(Math.abs(num))}`;
};

const sanitizeMoneyInput = (value) => {
  const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length === 1) return parts[0];

  const integerPart = parts[0];
  const decimalPart = parts.slice(1).join("").slice(0, 2);
  return `${integerPart}.${decimalPart}`;
};

const formatMoneyOnBlur = (value) => {
  const sanitized = sanitizeMoneyInput(value);
  if (!sanitized) return "";
  const num = Number(sanitized);
  if (Number.isNaN(num)) return "";
  return num.toFixed(2);
};

const getSalaryEmployeeLabel = (employee) =>
  `${employee?.last_name || ""}, ${employee?.first_name || ""} (${employee?.emp_id || ""})`;

const getMonthsInRange = (startPeriod, endPeriod) => {
  if (!/^\d{4}-\d{2}$/.test(String(startPeriod || ""))) return [];
  if (!/^\d{4}-\d{2}$/.test(String(endPeriod || ""))) return [];

  const [startYear, startMonth] = startPeriod.split("-").map(Number);
  const [endYear, endMonth] = endPeriod.split("-").map(Number);

  const start = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);
  if (start > end) return [];

  const months = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    months.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
};

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function Payroll({ shortcutMode = false }) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, showToast, clearToast } = useToast();
  const [period, setPeriod] = useState(getCurrentPeriod);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("wah_user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const isAdmin = currentUser?.role === "Admin";

  // Modal & Form States
  const [adjustmentModal, setAdjustmentModal] = useState(null);
  const [salarySettingsModal, setSalarySettingsModal] = useState(false);
  const [confirmSalarySettingsModal, setConfirmSalarySettingsModal] =
    useState(false);
  const [salaryBreakdownModal, setSalaryBreakdownModal] = useState(null);
  const [resetConfirmModal, setResetConfirmModal] = useState(false);
  const [editingHistoryEntry, setEditingHistoryEntry] = useState(null);
  const [isGeneratingPayrollPdf, setIsGeneratingPayrollPdf] = useState(false);

  const [adjustmentType, setAdjustmentType] = useState("Incentive");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentLineItems, setAdjustmentLineItems] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("wah_deduction_types") || "[]",
      );
      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
    } catch {
      // Ignore malformed local storage values.
    }
    return DEFAULT_DEDUCTION_TYPES;
  });
  const [selectedDeductionType, setSelectedDeductionType] = useState(
    DEFAULT_DEDUCTION_TYPES[0],
  );
  const [newDeductionType, setNewDeductionType] = useState("");
  const [incentiveTypes, setIncentiveTypes] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("wah_incentive_types") || "[]",
      );
      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
    } catch {
      // Ignore malformed local storage values.
    }
    return DEFAULT_INCENTIVE_TYPES;
  });
  const [selectedIncentiveType, setSelectedIncentiveType] = useState(
    DEFAULT_INCENTIVE_TYPES[0],
  );
  const [newIncentiveType, setNewIncentiveType] = useState("");
  const [applyToOtherMonth, setApplyToOtherMonth] = useState(false);
  const [adjustmentTargetPeriod, setAdjustmentTargetPeriod] = useState(period);
  const [applyByRange, setApplyByRange] = useState(false);
  const [adjustmentRangeStart, setAdjustmentRangeStart] = useState(period);
  const [adjustmentRangeEnd, setAdjustmentRangeEnd] = useState(period);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [bulkAdjustmentMode, setBulkAdjustmentMode] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearchTerm = useDebounce(search, 500);
  const [designationFilter, setDesignationFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, designationFilter, period]);

  const [salaryForm, setSalaryForm] = useState({
    emp_id: "",
    amount: "",
  });
  const [salaryEmployeeSearch, setSalaryEmployeeSearch] = useState("");

  // --- QUERIES ---
  const {
    data: responseData,
    isLoading: isLoadingPayroll,
    isFetching: isFetchingPayroll,
  } = useQuery({
    queryKey: [
      "payroll",
      period,
      currentPage,
      debouncedSearchTerm,
      designationFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        designationFilter: designationFilter,
      });
      return mutationHandler(
        axiosInterceptor.get(`/api/employees/payroll?${params.toString()}`),
        "Failed to fetch payroll",
      );
    },
  });

  const payrollData = responseData?.data || [];
  const totalPages = responseData?.totalPages || 1;
  const totalRecords = responseData?.total || 0;

  // Unfiltered summary for the period (persists across search/filter)
  const { data: unfilteredSummaryData } = useQuery({
    queryKey: ["payroll-summary", period],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        page: "1",
        limit: "1",
        search: "",
        designationFilter: "All",
      });
      return mutationHandler(
        axiosInterceptor.get(`/api/employees/payroll?${params.toString()}`),
        "Failed to fetch payroll summary",
      );
    },
  });

  const { data: employeesData = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      return mutationHandler(
        axiosInterceptor.get("/api/employees?all=true"),
        "Failed to fetch employees",
      );
    },
  });

  const salaryEmployeeOptions = useMemo(() => {
    const rows = Array.isArray(employeesData?.data) ? employeesData.data : [];
    return [...rows].sort((a, b) => {
      const aName = `${a.first_name || ""} ${a.last_name || ""}`.trim();
      const bName = `${b.first_name || ""} ${b.last_name || ""}`.trim();
      return aName.localeCompare(bName);
    });
  }, [employeesData]);

  const selectedSalaryEmployee = useMemo(
    () =>
      salaryEmployeeOptions.find(
        (employee) => employee.emp_id === salaryForm.emp_id,
      ),
    [salaryEmployeeOptions, salaryForm.emp_id],
  );

  useEffect(() => {
    if (selectedSalaryEmployee) {
      setSalaryEmployeeSearch(getSalaryEmployeeLabel(selectedSalaryEmployee));
    }
  }, [selectedSalaryEmployee]);

  const handleSalaryEmployeeSearchChange = (value) => {
    setSalaryEmployeeSearch(value);

    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    const matchedEmployee = salaryEmployeeOptions.find(
      (employee) =>
        getSalaryEmployeeLabel(employee).toLowerCase() === normalized,
    );

    setSalaryForm((prev) => ({
      ...prev,
      emp_id: matchedEmployee?.emp_id || "",
    }));
  };

  const { data: salaryHistoryData = [] } = useQuery({
    queryKey: [
      "salary-history",
      adjustmentModal?.emp_id,
      applyToOtherMonth ? adjustmentTargetPeriod : period,
    ],
    enabled: Boolean(adjustmentModal?.emp_id),
    queryFn: async () => {
      const activePeriod = applyToOtherMonth ? adjustmentTargetPeriod : period;
      return mutationHandler(
        axiosInterceptor.get(
          `/api/employees/salary-history/${adjustmentModal.emp_id}?period=${activePeriod}`,
        ),
        "Failed to fetch salary history",
      );
    },
  });

  // --- MUTATIONS ---

  // NEW: Individual Email Mutation
  const sendPayslipMutation = useMutation({
    mutationFn: async (emp_id) => {
      return mutationHandler(
        axiosInterceptor.post(`/api/employees/payroll/${emp_id}/send-payslip`, {
          period,
        }),
        "Failed to send payslip",
      );
    },
    onSuccess: () =>
      showToast("Payslip sent successfully!", "success", TOAST_DURATION_LONG),
    onError: () =>
      showToast(
        "Failed to send payslip. Check server logs.",
        "error",
        TOAST_DURATION_LONG,
      ),
  });

  const sendBulkPayslipsMutation = useMutation({
    mutationFn: async (selectedPeriod) => {
      return mutationHandler(
        axiosInterceptor.post("/api/employees/payroll/send-bulk-payslips", {
          period: selectedPeriod,
        }),
        "Failed to send bulk payslips",
      );
    },
    onSuccess: (data) => {
      // Using the period from the mutation argument or state
      showToast(
        `Success! All payslips for ${period} have been dispatched.`,
        "success",
        TOAST_DURATION_LONG,
      );
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, "error");
      console.error("Payroll Dispatch Error:", error);
    },
  });

  const adjustmentMutation = useMutation({
    mutationFn: async (payload) => {
      return mutationHandler(
        axiosInterceptor.post("/api/employees/salary-adjustment", payload),
        "Failed to save adjustments",
      );
    },
  });

  const updateHistoryEntryMutation = useMutation({
    mutationFn: async (payload) => {
      return mutationHandler(
        axiosInterceptor.put(`/api/employees/salary-history/${payload.id}`, {
          type: payload.type,
          amount: payload.amount,
          description: payload.description,
        }),
        "Failed to update adjustment",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({
        queryKey: ["salary-history", adjustmentModal?.emp_id],
      });
      setEditingHistoryEntry(null);
      showToast("Adjustment updated successfully.");
    },
    onError: () => showToast("Failed to update adjustment.", "error"),
  });

  const deleteHistoryEntryMutation = useMutation({
    mutationFn: async (id) => {
      return mutationHandler(
        axiosInterceptor.delete(`/api/employees/salary-history/${id}`),
        "Failed to remove adjustment",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({
        queryKey: ["salary-history", adjustmentModal?.emp_id],
      });
      showToast("Adjustment removed successfully.");
    },
    onError: () => showToast("Failed to remove adjustment.", "error"),
  });

  const updateBaseSalaryMutation = useMutation({
    mutationFn: async (payload) => {
      return mutationHandler(
        axiosInterceptor.put("/api/employees/update-base-salary", payload),
        "Failed to update base salary",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });

      showToast("Base salary updated for selected employee.");
      setSalaryForm({ emp_id: "", amount: "" });
      setSalaryEmployeeSearch("");
      setConfirmSalarySettingsModal(false);
      setSalarySettingsModal(false);
    },
    onError: () => showToast("Failed to update base salary.", "error"),
  });

  const generatePayrollMutation = useMutation({
    mutationFn: async () => {
      return mutationHandler(
        axiosInterceptor.post("/api/employees/generate-payroll", { period }),
        "Failed to generate payroll",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
    onError: (err) =>
      console.error(err.message || "Failed to generate payroll."),
  });

  const resetPayrollMutation = useMutation({
    mutationFn: async () => {
      return mutationHandler(
        axiosInterceptor.post("/api/employees/reset-payroll"),
        "Failed to reset payroll data",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      setResetConfirmModal(false);
      showToast("All payroll data has been reset successfully.");
    },
    onError: () => {
      showToast("Failed to reset payroll data.", "error");
    },
  });

  // Auto-generate payroll when period changes
  useEffect(() => {
    if (isAdmin) {
      generatePayrollMutation.mutate();
    }
  }, [period]);

  useEffect(() => {
    if (!shortcutMode && searchParams.get("open") !== "salary-settings") return;

    setSalarySettingsModal(true);

    if (shortcutMode) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("open");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, shortcutMode]);

  useEffect(() => {
    if (!Array.isArray(deductionTypes) || deductionTypes.length === 0) return;
    localStorage.setItem("wah_deduction_types", JSON.stringify(deductionTypes));
    if (!deductionTypes.includes(selectedDeductionType)) {
      setSelectedDeductionType(deductionTypes[0]);
    }
  }, [deductionTypes, selectedDeductionType]);

  useEffect(() => {
    if (!Array.isArray(incentiveTypes) || incentiveTypes.length === 0) return;
    localStorage.setItem("wah_incentive_types", JSON.stringify(incentiveTypes));
    if (!incentiveTypes.includes(selectedIncentiveType)) {
      setSelectedIncentiveType(incentiveTypes[0]);
    }
  }, [incentiveTypes, selectedIncentiveType]);

  // --- HANDLERS ---
  const getCurrentAdjustmentDescription = () =>
    adjustmentType === "Decrease"
      ? selectedDeductionType
      : selectedIncentiveType;

  const addCurrentAdjustmentLine = () => {
    const amountValue = Number(adjustmentAmount);
    if (!adjustmentAmount || Number.isNaN(amountValue) || amountValue <= 0) {
      showToast("Enter a valid amount greater than 0.", "error");
      return;
    }

    const descriptionValue = getCurrentAdjustmentDescription();
    if (!descriptionValue) {
      showToast("Select a type.", "error");
      return;
    }

    const nextLine = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: adjustmentType,
      description: descriptionValue,
      amount: Number(amountValue.toFixed(2)),
    };

    setAdjustmentLineItems((prev) => [...prev, nextLine]);
    setAdjustmentAmount("");
  };

  const removeAdjustmentLine = (lineId) => {
    setAdjustmentLineItems((prev) => prev.filter((line) => line.id !== lineId));
  };

  const handleAdjustment = async () => {
    const currentAmountValue = Number(adjustmentAmount);
    const currentDescription = getCurrentAdjustmentDescription();
    const hasCurrentDraft =
      !!adjustmentAmount &&
      !Number.isNaN(currentAmountValue) &&
      currentAmountValue > 0 &&
      !!currentDescription;

    const lineItems = [
      ...adjustmentLineItems,
      ...(hasCurrentDraft
        ? [
            {
              id: "draft",
              type: adjustmentType,
              description: currentDescription,
              amount: Number(currentAmountValue.toFixed(2)),
            },
          ]
        : []),
    ];

    if (lineItems.length === 0) {
      return showToast(
        "Add at least one adjustment line (incentive or deduction).",
        "error",
      );
    }

    if (adjustmentType === "Decrease" && !selectedDeductionType) {
      return showToast("Select a deduction type.", "error");
    }

    if (adjustmentType === "Incentive" && !selectedIncentiveType) {
      return showToast("Select an incentive type.", "error");
    }

    const targetPeriod = applyToOtherMonth ? adjustmentTargetPeriod : period;

    let targetPeriods = [targetPeriod];
    if (applyToOtherMonth && applyByRange) {
      targetPeriods = getMonthsInRange(
        adjustmentRangeStart,
        adjustmentRangeEnd,
      );
      if (targetPeriods.length === 0) {
        return showToast("Select a valid month range.", "error");
      }
    } else if (!/^\d{4}-\d{2}$/.test(String(targetPeriod || ""))) {
      return showToast("Select a valid target month.", "error");
    }

    const empIds = bulkAdjustmentMode
      ? Array.from(selectedEmployees)
      : [adjustmentModal.emp_id];
    if (empIds.length === 0)
      return showToast("No employees selected.", "error");

    try {
      for (const month of targetPeriods) {
        for (const line of lineItems) {
          await adjustmentMutation.mutateAsync({
            emp_ids: empIds,
            type: line.type,
            amount: line.amount,
            description: line.description,
            date: `${month}-01`,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({
        queryKey: ["salary-history", adjustmentModal?.emp_id],
      });

      if (targetPeriods.length > 1) {
        showToast(
          `Adjustments applied successfully across ${targetPeriods.length} months.`,
        );
      } else {
        showToast("Adjustments applied successfully.");
      }
      closeAdjustmentModal();
    } catch {
      showToast("Failed to apply adjustments.", "error");
    }
  };

  const handleBaseSalaryUpdate = (e) => {
    e.preventDefault();
    if (!salaryForm.emp_id || !salaryForm.amount)
      return showToast("Fill in all fields.", "error");

    setConfirmSalarySettingsModal(true);
  };

  const confirmBaseSalaryUpdate = () => {
    updateBaseSalaryMutation.mutate({
      emp_id: salaryForm.emp_id,
      amount: salaryForm.amount,
    });
  };

  const closeAdjustmentModal = () => {
    setAdjustmentModal(null);
    setAdjustmentAmount("");
    setAdjustmentLineItems([]);
    setNewDeductionType("");
    setNewIncentiveType("");
    setApplyToOtherMonth(false);
    setAdjustmentTargetPeriod(period);
    setApplyByRange(false);
    setAdjustmentRangeStart(period);
    setAdjustmentRangeEnd(period);
    setAdjustmentType("Incentive");
    setEditingHistoryEntry(null);
    setSelectedEmployees(new Set());
  };

  const startEditHistoryEntry = (entry) => {
    const uiType = toUiAdjustmentCategory(entry.type);
    const fallbackType =
      uiType === "Decrease" ? deductionTypes[0] : incentiveTypes[0];

    setEditingHistoryEntry({
      id: entry.id,
      type: uiType,
      amount: Number(entry.amount || 0),
      description: entry.description || fallbackType || "",
    });
  };

  const saveEditHistoryEntry = () => {
    if (!editingHistoryEntry) return;

    if (
      !editingHistoryEntry.amount ||
      Number(editingHistoryEntry.amount) <= 0
    ) {
      showToast("Amount must be greater than 0.", "error");
      return;
    }

    const fallbackType =
      editingHistoryEntry.type === "Decrease"
        ? deductionTypes[0]
        : incentiveTypes[0];
    const selectedType =
      String(editingHistoryEntry.description || "").trim() || fallbackType;

    if (!selectedType) {
      showToast("Select a type.", "error");
      return;
    }

    updateHistoryEntryMutation.mutate({
      id: editingHistoryEntry.id,
      type: editingHistoryEntry.type,
      amount: Number(editingHistoryEntry.amount),
      description: selectedType,
    });
  };

  const removeHistoryEntry = (id) => {
    if (!window.confirm("Remove this adjustment entry?")) return;
    deleteHistoryEntryMutation.mutate(id);
  };

  const addDeductionType = () => {
    const value = newDeductionType.trim();
    if (!value) return;

    const exists = deductionTypes.some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );

    if (exists) {
      setSelectedDeductionType(
        deductionTypes.find(
          (item) => item.toLowerCase() === value.toLowerCase(),
        ) || value,
      );
      setNewDeductionType("");
      return;
    }

    const updated = [...deductionTypes, value].sort((a, b) =>
      a.localeCompare(b),
    );
    setDeductionTypes(updated);
    setSelectedDeductionType(value);
    setNewDeductionType("");
  };

  const removeDeductionType = () => {
    if (deductionTypes.length <= 1) {
      showToast("At least one deduction type must remain.", "error");
      return;
    }

    const updated = deductionTypes.filter(
      (item) => item !== selectedDeductionType,
    );
    setDeductionTypes(updated);
    setSelectedDeductionType(updated[0] || "");
  };

  const addIncentiveType = () => {
    const value = newIncentiveType.trim();
    if (!value) return;

    const exists = incentiveTypes.some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );

    if (exists) {
      setSelectedIncentiveType(
        incentiveTypes.find(
          (item) => item.toLowerCase() === value.toLowerCase(),
        ) || value,
      );
      setNewIncentiveType("");
      return;
    }

    const updated = [...incentiveTypes, value].sort((a, b) =>
      a.localeCompare(b),
    );
    setIncentiveTypes(updated);
    setSelectedIncentiveType(value);
    setNewIncentiveType("");
  };

  const removeIncentiveType = () => {
    if (incentiveTypes.length <= 1) {
      showToast("At least one incentive type must remain.", "error");
      return;
    }

    const updated = incentiveTypes.filter(
      (item) => item !== selectedIncentiveType,
    );
    setIncentiveTypes(updated);
    setSelectedIncentiveType(updated[0] || "");
  };

  const toggleEmployeeSelection = (id) => {
    const newSelected = new Set(selectedEmployees);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedEmployees(newSelected);
  };

  const designationOptions = useMemo(() => {
    // In a paginated setup with server-side filtering, getting all designations
    // dynamically from the fetched page might not be accurate. But we'll leave it
    // extracting from current data or define a static list if possible.
    const unique = new Set();
    for (const row of payrollData) {
      if (row.designation) unique.add(row.designation);
    }
    return ["All", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [payrollData]);

  const currentPeriodHistory = useMemo(
    () => salaryHistoryData,
    [salaryHistoryData],
  );

  useEffect(() => {
    if (adjustmentModal) {
      setApplyToOtherMonth(false);
      setAdjustmentTargetPeriod(period);
      setApplyByRange(false);
      setAdjustmentRangeStart(period);
      setAdjustmentRangeEnd(period);
    }
  }, [adjustmentModal, period]);

  const allFilteredSelected =
    payrollData.length > 0 &&
    payrollData.every((p) => selectedEmployees.has(p.emp_id));

  const payrollSummary = {
    count: Number(unfilteredSummaryData?.total || 0),
    gross: Number(unfilteredSummaryData?.summary?.gross || 0),
    deductions: Number(unfilteredSummaryData?.summary?.deductions || 0),
    net: Number(unfilteredSummaryData?.summary?.net || 0),
  };

  const handleGeneratePayrollPdf = async () => {
    if (!isAdmin) return;
    if (!payrollSummary.count) {
      showToast("No payroll records found for this period.", "error");
      return;
    }

    setIsGeneratingPayrollPdf(true);
    try {
      const params = new URLSearchParams({
        period,
        all: "true",
        search: "",
        designationFilter: "All",
      });

      const allPayrollResponse = await mutationHandler(
        axiosInterceptor.get(`/api/employees/payroll?${params.toString()}`),
        "Failed to fetch complete payroll data",
      );

      const allRows = Array.isArray(allPayrollResponse?.data)
        ? allPayrollResponse.data
        : [];

      if (allRows.length === 0) {
        showToast("No payroll records found for this period.", "error");
        return;
      }

      const sortedRows = [...allRows].sort((a, b) => {
        const aName = `${a.first_name || ""} ${a.last_name || ""}`.trim();
        const bName = `${b.first_name || ""} ${b.last_name || ""}`.trim();
        return aName.localeCompare(bName);
      });

      const blob = await pdf(
        <PayrollSummaryDoc rows={sortedRows} period={period} />,
      ).toBlob();

      const fileName = `payroll-summary-${period || "report"}.pdf`;
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);

      showToast("Payroll PDF generated successfully.");
    } catch (error) {
      console.error("Payroll PDF generation failed:", error);
      showToast("Failed to generate payroll PDF.", "error");
    } finally {
      setIsGeneratingPayrollPdf(false);
    }
  };

  if (isLoadingEmployees)
    return (
      <div className="p-6 text-gray-900 dark:text-gray-100 font-bold">
        Loading Payroll Data...
      </div>
    );

  return (
    <div>
      {!shortcutMode && (
        <>
          <div className="flex items-center justify-between gap-4 mb-6 flex-nowrap">
            <h1 className="m-0 text-[1.4rem] font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap flex-shrink-0">
              Payroll
            </h1>
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mr-2">
                Period:
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </label>

              {isAdmin && (
                <>
                  <button
                    onClick={() => setSalarySettingsModal(true)}
                    className="px-4 py-2 rounded-lg bg-blue-600 border border-blue-600 text-white text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Salary Settings
                  </button>

                  {/* NEW: Bulk Email Button */}
                  <button
                    onClick={() => {
                      // Ensure 'period' is the actual value (e.g., "2024-03")
                      if (
                        window.confirm(
                          `Are you sure you want to send payslips to all employees for the period of ${period}?`,
                        )
                      ) {
                        // PASS THE PERIOD HERE
                        sendBulkPayslipsMutation.mutate(period);
                      }
                    }}
                    disabled={
                      sendBulkPayslipsMutation.isPending ||
                      payrollData.length === 0
                    }
                    className="px-4 py-2 rounded-lg bg-indigo-600 border border-indigo-600 text-white text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    {sendBulkPayslipsMutation.isPending
                      ? `Sending to ${payrollData.length} employees...`
                      : "Email All"}
                  </button>

                  <button
                    onClick={handleGeneratePayrollPdf}
                    disabled={isGeneratingPayrollPdf || !payrollSummary.count}
                    className="px-4 py-2 rounded-lg bg-emerald-600 border border-emerald-600 text-white text-sm font-semibold cursor-pointer hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileDown className="w-4 h-4" />
                    {isGeneratingPayrollPdf
                      ? "Generating PDF..."
                      : "Generate Payroll PDF"}
                  </button>

                  <button
                    onClick={() => {
                      setBulkAdjustmentMode(!bulkAdjustmentMode);
                      setSelectedEmployees(new Set());
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors border ${bulkAdjustmentMode ? "bg-gray-900 text-white border-gray-900" : "bg-black text-white border-black hover:bg-gray-800"}`}
                  >
                    {bulkAdjustmentMode ? "Cancel Bulk" : "Adjust Multiple"}
                  </button>

                  <button
                    onClick={() => setResetConfirmModal(true)}
                    className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Reset All Data
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-sm">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Employees
              </p>
              <p className="m-0 mt-1 text-xl font-black text-gray-900 dark:text-gray-100">
                {employeesData?.total || 0}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-sm">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Gross Total
              </p>
              <p className="m-0 mt-1 text-xl font-black text-gray-900 dark:text-gray-100">
                {fmt(payrollSummary.gross)}
              </p>
            </div>
            <div className="rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 p-3 shadow-sm">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Deductions
              </p>
              <p className="m-0 mt-1 text-xl font-black text-red-700 dark:text-red-300">
                -{fmt(payrollSummary.deductions)}
              </p>
            </div>
            <div className="rounded-lg border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 p-3 shadow-sm">
              <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                Net Total
              </p>
              <p className="m-0 mt-1 text-xl font-black text-green-700 dark:text-green-300">
                {fmt(payrollSummary.net)}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                className="w-full max-w-[300px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={designationFilter}
                onChange={(e) => {
                  setDesignationFilter(e.target.value);
                  setSelectedEmployees(new Set());
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-purple-500"
              >
                {designationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All Designations" : option}
                  </option>
                ))}
              </select>

              {isAdmin && bulkAdjustmentMode && selectedEmployees.size > 0 && (
                <button
                  onClick={() =>
                    setAdjustmentModal({
                      name: `${selectedEmployees.size} Employee(s)`,
                      isBulk: true,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold cursor-pointer hover:bg-green-700 border-0"
                >
                  Apply Adjustment to {selectedEmployees.size} Employees
                </button>
              )}
            </div>
          </div>

          {!isAdmin && (
            <div className="mb-3 rounded-lg border border-sky-200 dark:border-sky-800/30 bg-sky-50 dark:bg-sky-900/20 px-4 py-2.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
              View-only mode: only Admin can generate payroll, adjust salaries,
              and update salary settings.
            </div>
          )}

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {isAdmin && bulkAdjustmentMode && (
                      <th className="px-6 py-3 text-center w-12">
                        <input
                          type="checkbox"
                          onChange={() =>
                            setSelectedEmployees(
                              allFilteredSelected
                                ? new Set()
                                : new Set(payrollData.map((p) => p.emp_id)),
                            )
                          }
                          checked={allFilteredSelected}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                      ID
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">
                      Name
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs text-right">
                      Basic Pay
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs text-right">
                      Incentives
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs text-right">
                      Total Salary (Gross)
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs text-right">
                      Deductions
                    </th>
                    <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs text-right">
                      Net Pay
                    </th>
                    {isAdmin && !bulkAdjustmentMode && (
                      <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs text-right">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {isLoadingPayroll || isFetchingPayroll ? (
                    Array.from({ length: itemsPerPage }).map((_, i) => (
                      <tr key={`skeleton-${i}`}>
                        {isAdmin && bulkAdjustmentMode && (
                          <td className="px-6 py-4">
                            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mx-auto" />
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="h-4 w-16 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-28 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 w-20 rounded-md bg-gray-200 animate-pulse ml-auto" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 w-20 rounded-md bg-gray-200 animate-pulse ml-auto" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 w-20 rounded-md bg-gray-200 animate-pulse ml-auto" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 w-20 rounded-md bg-gray-200 animate-pulse ml-auto" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 w-20 rounded-md bg-gray-200 animate-pulse ml-auto" />
                        </td>
                        {isAdmin && !bulkAdjustmentMode && (
                          <td className="px-6 py-4 text-right">
                            <div className="h-4 w-24 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse ml-auto" />
                          </td>
                        )}
                      </tr>
                    ))
                  ) : payrollData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 8 : 7}
                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        No payroll records found for {period}. kindly contact
                        Gregg if you have any concerns.
                      </td>
                    </tr>
                  ) : (
                    payrollData.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => {
                          if (isAdmin && bulkAdjustmentMode) {
                            toggleEmployeeSelection(p.emp_id);
                          }
                        }}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedEmployees.has(p.emp_id) ? "bg-purple-50 dark:bg-purple-900/20" : ""} ${isAdmin && bulkAdjustmentMode ? "cursor-pointer" : ""}`}
                      >
                        {isAdmin && bulkAdjustmentMode && (
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.has(p.emp_id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleEmployeeSelection(p.emp_id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4">{p.emp_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-bold text-gray-900 dark:text-gray-100">
                                {p.first_name} {p.last_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                                {p.position}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {fmt(p.basic_pay)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className={`font-semibold ${Number(p.incentives || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            {fmtSigned(p.incentives)}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {p.incentive_reasons || "No incentive type"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {fmt(p.gross_pay)}
                        </td>
                        <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">
                          <div className="font-semibold">
                            {fmt(p.absence_deductions)}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {p.deduction_reasons || "No deduction type"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-purple-700 dark:text-purple-400">
                          {fmt(p.net_pay)}
                        </td>
                        {isAdmin && !bulkAdjustmentMode && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sendPayslipMutation.mutate(p.emp_id);
                                }}
                                disabled={
                                  sendPayslipMutation.isPending &&
                                  sendPayslipMutation.variables === p.emp_id
                                }
                                className="px-3 py-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold border-0 cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900/50 flex items-center gap-1.5"
                                title="Send Email"
                              >
                                <Mail className="w-3 h-3" />
                                Email
                              </button>

                              <button
                                onClick={() => setSalaryBreakdownModal(p)}
                                className="px-3 py-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold border-0 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setAdjustmentModal(p)}
                                className="px-3 py-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold border-0 cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/50"
                              >
                                Adjust
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-sm text-gray-700 dark:text-gray-400">
                    Showing{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {Math.min(currentPage * itemsPerPage, totalRecords)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {totalRecords}
                    </span>{" "}
                    results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-900 cursor-pointer"
                    >
                      Previous
                    </button>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
                      Page {currentPage} of {totalPages}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-900 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Salary Settings Modal (With Grouped Preview Table & Dropdown) */}
      {isAdmin && salarySettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-gray-900 flex justify-between items-center text-white shrink-0">
              <h2 className="text-lg font-bold m-0">
                Employee Salary Settings
              </h2>
              <button
                onClick={() => setSalarySettingsModal(false)}
                className="text-white text-2xl bg-transparent border-0 cursor-pointer hover:text-gray-300"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                    Update Base Salary
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-5">
                    Select a designation and position to enter the new monthly
                    base salary. This will immediately apply to all employees
                    currently holding this position.
                  </p>
                  <form onSubmit={handleBaseSalaryUpdate} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Select Employee
                      </label>
                      <input
                        type="text"
                        list="salary-employee-options"
                        value={salaryEmployeeSearch}
                        onChange={(e) =>
                          handleSalaryEmployeeSearchChange(e.target.value)
                        }
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Type to search employee..."
                      />
                      <datalist id="salary-employee-options">
                        {salaryEmployeeOptions.map((emp) => (
                          <option
                            key={emp.emp_id}
                            value={getSalaryEmployeeLabel(emp)}
                          />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        New Monthly Base Salary
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                          ₱
                        </span>
                        <input
                          required
                          type="text"
                          inputMode="decimal"
                          value={salaryForm.amount}
                          onChange={(e) =>
                            setSalaryForm({
                              ...salaryForm,
                              amount: sanitizeMoneyInput(e.target.value),
                            })
                          }
                          onBlur={() =>
                            setSalaryForm({
                              ...salaryForm,
                              amount: formatMoneyOnBlur(salaryForm.amount),
                            })
                          }
                          placeholder="0.00"
                          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmSalarySettingsModal(false);
                          setSalarySettingsModal(false);
                          setSalaryEmployeeSearch("");
                          setSalaryForm({
                            emp_id: "",
                            amount: "",
                          });
                        }}
                        className="flex-1 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={updateBaseSalaryMutation.isPending}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-semibold cursor-pointer border-0 hover:bg-purple-700 disabled:opacity-50"
                      >
                        {updateBaseSalaryMutation.isPending
                          ? "Updating..."
                          : "Update Employee"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  Salary settings are Admin-only and apply per selected
                  employee.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && confirmSalarySettingsModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden border border-transparent dark:border-gray-800">
            <div className="px-6 py-4 bg-gray-900 text-white">
              <h3 className="m-0 text-base font-bold">Confirm Salary Update</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="m-0 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Update monthly base salary for
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {" "}
                  {selectedSalaryEmployee
                    ? `${selectedSalaryEmployee.first_name} ${selectedSalaryEmployee.last_name}`
                    : "the selected employee"}
                </span>
                to
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {" "}
                  {fmt(salaryForm.amount)}
                </span>
                ?
              </p>
              <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
                This will apply only to this employee.
              </p>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmSalarySettingsModal(false)}
                  disabled={updateBaseSalaryMutation.isPending}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmBaseSalaryUpdate}
                  disabled={updateBaseSalaryMutation.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer border-0 hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateBaseSalaryMutation.isPending
                    ? "Updating..."
                    : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Breakdown Modal */}
      {salaryBreakdownModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center text-white">
              <h2 className="text-lg font-semibold m-0">Salary Breakdown</h2>
              <button
                onClick={() => setSalaryBreakdownModal(null)}
                className="text-white text-2xl bg-transparent border-0 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                {salaryBreakdownModal.first_name}{" "}
                {salaryBreakdownModal.last_name}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="font-semibold text-gray-700 dark:text-gray-400">
                    Basic Pay
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold">
                    {fmt(salaryBreakdownModal.basic_pay)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20">
                  <span className="font-semibold text-red-700 dark:text-red-400">
                    Deductions
                  </span>
                  <span className="text-red-700 dark:text-red-400 font-bold">
                    -{fmt(salaryBreakdownModal.absence_deductions)}
                  </span>
                </div>
                {salaryBreakdownModal.deduction_reasons && (
                  <div className="py-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/30 p-3">
                    <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase mb-2">
                      Deduction Types:
                    </p>
                    <p className="text-xs text-red-900 dark:text-red-200 leading-relaxed">
                      {salaryBreakdownModal.deduction_reasons}
                    </p>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20">
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    Incentives
                  </span>
                  <span
                    className={`font-bold ${Number(salaryBreakdownModal.incentives || 0) >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                  >
                    {fmtSigned(salaryBreakdownModal.incentives)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20">
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    Total Salary (Gross)
                  </span>
                  <span className="text-green-700 font-bold dark:text-green-400">
                    {fmt(salaryBreakdownModal.gross_pay)}
                  </span>
                </div>
                {salaryBreakdownModal.incentive_reasons && (
                  <div className="py-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/30 p-3">
                    <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300 uppercase mb-2">
                      Incentive Types:
                    </p>
                    <p className="text-xs text-yellow-900 dark:text-yellow-200 leading-relaxed">
                      {salaryBreakdownModal.incentive_reasons}
                    </p>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <span className="font-bold text-purple-900 dark:text-purple-300">
                    Net Pay
                  </span>
                  <span className="text-purple-900 dark:text-purple-100 font-black text-lg">
                    {fmt(salaryBreakdownModal.net_pay)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {isAdmin && adjustmentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 flex justify-between items-center text-white">
              <h2 className="text-lg font-semibold m-0">
                {bulkAdjustmentMode ? "Bulk Adjustment" : "Adjust Salary"}
              </h2>
              <button
                onClick={closeAdjustmentModal}
                className="text-white text-2xl bg-transparent border-0 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="max-h-[78vh] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-7">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {bulkAdjustmentMode
                      ? `${selectedEmployees.size} selected`
                      : `${adjustmentModal.first_name} ${adjustmentModal.last_name}`}
                  </p>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={applyToOtherMonth}
                        onChange={(e) => setApplyToOtherMonth(e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      Apply to another month
                    </label>
                    {applyToOtherMonth && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={applyByRange}
                            onChange={(e) => setApplyByRange(e.target.checked)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          Select month range
                        </label>

                        {applyByRange ? (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="month"
                              value={adjustmentRangeStart}
                              onChange={(e) =>
                                setAdjustmentRangeStart(e.target.value)
                              }
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                            <input
                              type="month"
                              value={adjustmentRangeEnd}
                              onChange={(e) =>
                                setAdjustmentRangeEnd(e.target.value)
                              }
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        ) : (
                          <input
                            type="month"
                            value={adjustmentTargetPeriod}
                            onChange={(e) =>
                              setAdjustmentTargetPeriod(e.target.value)
                            }
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="Incentive">Incentives</option>
                    <option value="Decrease">Deductions</option>
                  </select>
                  {adjustmentType === "Decrease" ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Deduction Type and Amount
                      </label>
                      <div className="flex gap-2 mb-2">
                        <select
                          value={selectedDeductionType}
                          onChange={(e) =>
                            setSelectedDeductionType(e.target.value)
                          }
                          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          {deductionTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <div className="relative w-36">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                            ₱
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={adjustmentAmount}
                            onChange={(e) =>
                              setAdjustmentAmount(
                                sanitizeMoneyInput(e.target.value),
                              )
                            }
                            onBlur={() =>
                              setAdjustmentAmount(
                                formatMoneyOnBlur(adjustmentAmount),
                              )
                            }
                            placeholder="0.00"
                            className="w-full border border-gray-300 rounded-lg p-2 pl-6 outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeDeductionType}
                          className="w-10 rounded-lg border border-red-300 bg-red-50 text-red-700 text-lg font-bold cursor-pointer hover:bg-red-100"
                          title="Remove selected deduction type"
                        >
                          -
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDeductionType}
                          onChange={(e) => setNewDeductionType(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addDeductionType();
                            }
                          }}
                          placeholder="Add deduction type"
                          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={addDeductionType}
                          className="w-10 rounded-lg border border-green-300 bg-green-50 text-green-700 text-lg font-bold cursor-pointer hover:bg-green-100"
                          title="Add deduction type"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Incentive Type and Amount
                      </label>
                      <div className="flex gap-2 mb-2">
                        <select
                          value={selectedIncentiveType}
                          onChange={(e) =>
                            setSelectedIncentiveType(e.target.value)
                          }
                          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          {incentiveTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <div className="relative w-36">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                            ₱
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={adjustmentAmount}
                            onChange={(e) =>
                              setAdjustmentAmount(
                                sanitizeMoneyInput(e.target.value),
                              )
                            }
                            onBlur={() =>
                              setAdjustmentAmount(
                                formatMoneyOnBlur(adjustmentAmount),
                              )
                            }
                            placeholder="0.00"
                            className="w-full border border-gray-300 rounded-lg p-2 pl-6 outline-none focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeIncentiveType}
                          className="w-10 rounded-lg border border-red-300 bg-red-50 text-red-700 text-lg font-bold cursor-pointer hover:bg-red-100"
                          title="Remove selected incentive type"
                        >
                          -
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newIncentiveType}
                          onChange={(e) => setNewIncentiveType(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addIncentiveType();
                            }
                          }}
                          placeholder="Add incentive type"
                          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={addIncentiveType}
                          className="w-10 rounded-lg border border-green-300 bg-green-50 text-green-700 text-lg font-bold cursor-pointer hover:bg-green-100"
                          title="Add incentive type"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 lg:col-span-5">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="m-0 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        Adjustment Lines
                      </p>
                      <button
                        type="button"
                        onClick={addCurrentAdjustmentLine}
                        className="rounded-md border border-purple-300 bg-purple-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-purple-700 hover:bg-purple-100"
                      >
                        Add Line
                      </button>
                    </div>

                    {adjustmentLineItems.length === 0 ? (
                      <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
                        No line items added yet. You can mix incentives and
                        deductions.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {adjustmentLineItems.map((line, index) => (
                          <div
                            key={line.id}
                            className="flex items-center justify-between gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-2"
                          >
                            <div className="min-w-0">
                              <p className="m-0 truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
                                {index + 1}.{" "}
                                {line.type === "Decrease"
                                  ? "Deduction"
                                  : "Incentive"}{" "}
                                - {line.description}
                              </p>
                              <p className="m-0 mt-0.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                ₱{Number(line.amount || 0).toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAdjustmentLine(line.id)}
                              className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-100"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      onClick={closeAdjustmentModal}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdjustment}
                      disabled={adjustmentMutation.isPending}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium cursor-pointer border-0 hover:bg-purple-700"
                    >
                      {adjustmentMutation.isPending
                        ? "Applying..."
                        : applyToOtherMonth && applyByRange
                          ? "Apply to Range"
                          : "Apply"}
                    </button>
                  </div>

                  {!bulkAdjustmentMode && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                        Recent Deductions/Incentives (
                        {applyToOtherMonth
                          ? applyByRange
                            ? adjustmentRangeEnd
                            : adjustmentTargetPeriod
                          : period}
                        )
                      </p>
                      {currentPeriodHistory.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No editable adjustment records found for this month.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {currentPeriodHistory.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 flex items-center justify-between gap-2"
                            >
                              <div className="text-xs text-gray-700 dark:text-gray-300">
                                <span className="font-bold">
                                  {toUiAdjustmentCategory(entry.type) ===
                                  "Decrease"
                                    ? "Deduction"
                                    : "Incentive"}
                                </span>
                                : {entry.description || "No type provided"} ={" "}
                                {fmt(entry.amount)}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEditHistoryEntry(entry)}
                                  className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold border-0 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => removeHistoryEntry(entry.id)}
                                  disabled={
                                    deleteHistoryEntryMutation.isPending
                                  }
                                  className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold border-0 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-60"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && editingHistoryEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center text-white">
              <h2 className="text-lg font-semibold m-0">Edit Adjustment</h2>
              <button
                onClick={() => setEditingHistoryEntry(null)}
                className="text-white text-2xl bg-transparent border-0 cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Type and Amount
              </label>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <select
                  value={editingHistoryEntry.type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    const nextOptions =
                      nextType === "Decrease" ? deductionTypes : incentiveTypes;
                    const hasCurrentDescription = nextOptions.includes(
                      editingHistoryEntry.description,
                    );

                    setEditingHistoryEntry({
                      ...editingHistoryEntry,
                      type: nextType,
                      description: hasCurrentDescription
                        ? editingHistoryEntry.description
                        : nextOptions[0] || "",
                    });
                  }}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="Incentive">Incentives</option>
                  <option value="Decrease">Deductions</option>
                </select>
                <select
                  value={editingHistoryEntry.description || ""}
                  onChange={(e) =>
                    setEditingHistoryEntry({
                      ...editingHistoryEntry,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {(editingHistoryEntry.type === "Decrease"
                    ? deductionTypes
                    : incentiveTypes
                  ).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingHistoryEntry.amount}
                  onChange={(e) =>
                    setEditingHistoryEntry({
                      ...editingHistoryEntry,
                      amount: e.target.value,
                    })
                  }
                  placeholder="Amount"
                  className="w-28 border border-gray-300 dark:border-gray-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingHistoryEntry(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditHistoryEntry}
                  disabled={updateHistoryEntryMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium cursor-pointer border-0 hover:bg-blue-700 disabled:opacity-60"
                >
                  {updateHistoryEntryMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              Reset All Payroll Data?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This will permanently delete all payroll records and salary
              adjustments. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResetConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => resetPayrollMutation.mutate()}
                disabled={resetPayrollMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium cursor-pointer border-0 hover:bg-red-700 disabled:bg-red-400"
              >
                {resetPayrollMutation.isPending ? "Resetting..." : "Reset All"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
