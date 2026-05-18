import { useEffect, useReducer, useState } from "react";
import React from "react";
import { Eye, EyeOff } from "lucide-react";

import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

import { useRegister } from "../hooks/useRegister";
import { initialState, registerReducer } from "../registerReducer";
import { RegisterCredentials } from "../types";

const designations = {
  Operations: [
    "Supervisor(Finance & Operations)",
    "Assistant Finance & Operations Partner",
    "Admin & Human Resources Partner",
  ],
  "Health Program Partners": [
    "Supervisor(Health Program Partner)",
    "Health Program Partner",
    "Profiler",
  ],
  "Platform Innovation": [
    "Supervisor(Platform Innovation)",
    "Senior Platform Innovation Partner",
    "Platform Innovation Partner",
    "Data Analyst",
    "Business Analyst/Quality Assurance",
  ],
  "Network & System": [
    "Supervisor(Network & Systems)",
    "Network & Systems Partner",
  ],
} as const;

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:bg-slate-50 disabled:text-slate-500";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600";

const sectionClass =
  "rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:p-5";

const sectionTitleClass =
  "m-0 text-sm font-bold uppercase tracking-[0.16em] text-violet-700";

const sectionNoteClass = "m-0 mt-1 text-xs leading-5 text-slate-500";

export const RegisterForm = () => {
  const [state, dispatch] = useReducer(registerReducer, initialState);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const registerMutation = useRegister(showToast);

  useEffect(() => {
    if (registerMutation.isSuccess) {
      dispatch({ type: "RESET_FORM" });
      setConfirmPassword("");
    }
  }, [registerMutation.isSuccess]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "middle_initial") {
      dispatch({
        type: "UPDATE_FIELD",
        field: "middle_initial",
        value: value.slice(0, 1).toUpperCase(),
      });
      return;
    }

    if (name === "designation") {
      dispatch({ type: "UPDATE_FIELD", field: "designation", value });
      dispatch({ type: "UPDATE_FIELD", field: "position", value: "" });
      return;
    }

    dispatch({
      type: "UPDATE_FIELD",
      field: name as keyof RegisterCredentials,
      value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (state.password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    registerMutation.mutate(state as any);
  };

  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex items-center justify-between gap-4 border-b border-violet-100 bg-gradient-to-r from-violet-700 via-violet-600 to-fuchsia-600 px-5 py-4 text-white sm:px-6">
        <div>
          <h2 className="m-0 text-lg font-bold sm:text-xl">Employee Registration</h2>
          <p className="m-0 mt-1 text-xs text-white/80 sm:text-sm">
            Complete the form below to create a registration request.
          </p>
        </div>
        <div className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 sm:block">
          Pending approval
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-5 lg:p-6">
        {registerMutation.isSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 shadow-sm">
            Account created successfully. Your registration request is pending
            approval by Admin/HR before you can log in.
          </div>
        )}

        <section className={sectionClass} aria-labelledby="account-details-title">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 id="account-details-title" className={sectionTitleClass}>
                Account Details
              </h3>
              <p className={sectionNoteClass}>
                Use a valid employee ID and email address for verification.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <input
                name="emp_id"
                value={state.emp_id}
                onChange={handleInputChange}
                required
                maxLength={20}
                placeholder="EMP-001"
                className={fieldClass}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={state.email}
                onChange={handleInputChange}
                required
                maxLength={50}
                placeholder="name@domain.com"
                className={fieldClass}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={state.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className={`${fieldClass} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  className={`${fieldClass} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"
                  }
                  aria-pressed={showConfirmPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1"
                >
                  {showConfirmPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={sectionClass} aria-labelledby="identity-details-title">
          <div className="mb-4">
            <h3 id="identity-details-title" className={sectionTitleClass}>
              Identity and Role
            </h3>
            <p className={sectionNoteClass}>
              Keep the core employment details grouped for faster review.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="first_name"
                value={state.first_name}
                onChange={handleInputChange}
                required
                maxLength={30}
                placeholder="Juan"
                className={fieldClass}
                autoComplete="given-name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>M.I.</label>
              <input
                name="middle_initial"
                value={state.middle_initial}
                onChange={handleInputChange}
                maxLength={1}
                placeholder="W"
                className={fieldClass}
                autoComplete="additional-name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="last_name"
                value={state.last_name}
                onChange={handleInputChange}
                required
                maxLength={30}
                placeholder="Dela Cruz"
                className={fieldClass}
                autoComplete="family-name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Designation <span className="text-rose-500">*</span>
              </label>
              <select
                name="designation"
                value={state.designation}
                onChange={handleInputChange}
                required
                className={fieldClass}
              >
                <option value="">Select designation</option>
                {Object.keys(designations).map((designation) => (
                  <option key={designation} value={designation}>
                    {designation}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Position <span className="text-rose-500">*</span>
              </label>
              <select
                name="position"
                value={state.position}
                onChange={handleInputChange}
                required
                disabled={!state.designation}
                className={fieldClass}
              >
                <option value="">Select position</option>
                {state.designation &&
                  designations[state.designation as keyof typeof designations].map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Employment Status <span className="text-rose-500">*</span>
              </label>
              <select
                name="status"
                value={state.status}
                onChange={handleInputChange}
                className={fieldClass}
              >
                <option value="Permanent">Permanent</option>
                <option value="Job Order">Job Order</option>
                <option value="Casual">Casual</option>
                <option value="PGT Employee">PGT Employee</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Hired Date <span className="text-rose-500">*</span>
              </label>
              <input
                name="hired_date"
                type="date"
                value={state.hired_date}
                onChange={handleInputChange}
                required
                className={fieldClass}
              />
            </div>
          </div>
        </section>

        <section className={sectionClass} aria-labelledby="government-ids-title">
          <div className="mb-4">
            <h3 id="government-ids-title" className={sectionTitleClass}>
              Government IDs
            </h3>
            <p className={sectionNoteClass}>
              Add identification numbers for payroll and compliance records.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>PhilHealth No.</label>
              <input
                name="philhealth_no"
                value={state.philhealth_no}
                onChange={handleInputChange}
                placeholder="XX-XXXXXXXXX-X"
                className={fieldClass}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                TIN <span className="text-rose-500">*</span>
              </label>
              <input
                name="tin"
                value={state.tin}
                onChange={handleInputChange}
                placeholder="XXX-XXX-XXX-XXX"
                required
                className={fieldClass}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                SSS No. <span className="text-rose-500">*</span>
              </label>
              <input
                name="sss_no"
                value={state.sss_no}
                onChange={handleInputChange}
                required
                placeholder="XX-XXXXXX-X"
                className={fieldClass}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                PAG-IBIG MID <span className="text-rose-500">*</span>
              </label>
              <input
                name="pag_ibig_mid_no"
                value={state.pag_ibig_mid_no}
                onChange={handleInputChange}
                required
                placeholder="XXXX-XXXX-XXXX"
                className={fieldClass}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>GSIS No.</label>
              <input
                name="gsis_no"
                value={state.gsis_no}
                onChange={handleInputChange}
                placeholder="XXXXXXXXXX"
                className={fieldClass}
                autoComplete="off"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-xs leading-5 text-slate-500">
            Fields marked with an asterisk are required. Ensure your details
            match your employee records.
          </p>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="inline-flex min-w-[180px] items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-violet-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {registerMutation.isPending ? "Registering..." : "Register Now"}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
};
