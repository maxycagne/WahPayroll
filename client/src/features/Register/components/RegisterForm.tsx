import { useEffect, useReducer } from "react";
import { RegisterCredentials } from "../types";
import { useRegister } from "../hooks/useRegister";
import { initialState, registerReducer } from "../registerReducer";
import React from "react";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
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
};

export const RegisterForm = () => {
  const [state, dispatch] = useReducer(registerReducer, initialState);
  const { toast, showToast, clearToast } = useToast();
  const registerMutation = useRegister(showToast);

  useEffect(() => {
    if (registerMutation.isSuccess) {
      dispatch({ type: "RESET_FORM" });
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
    } else {
      dispatch({
        type: "UPDATE_FIELD",
        field: name as keyof RegisterCredentials,
        value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove emp_id from data before sending
    const { emp_id, ...data } = state;
    registerMutation.mutate(data as any);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden mx-auto">
      <div className="px-6 py-4 bg-purple-600 flex justify-between items-center text-white">
        <h2 className="text-xl font-bold m-0">Create Account</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {registerMutation.isSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Account created successfully. Your registration request is pending
            approval by Admin/HR before you can log in.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee ID Removed from Form */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={state.email}
              onChange={handleInputChange}
              required
              maxLength={50}
              className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              name="password"
              type="password"
              value={state.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                name="first_name"
                value={state.first_name}
                onChange={handleInputChange}
                required
                maxLength={30}
                className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                M.I.
              </label>
              <input
                name="middle_initial"
                value={state.middle_initial}
                onChange={handleInputChange}
                maxLength={1}
                className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Last Name<span className="text-red-500">*</span>
              </label>
              <input
                name="last_name"
                value={state.last_name}
                onChange={handleInputChange}
                required
                maxLength={30}
                className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Designation<span className="text-red-500">*</span>
            </label>
            <select
              name="designation"
              value={state.designation}
              onChange={handleInputChange}
              required
              className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">Select Designation</option>
              {Object.keys(designations).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Position<span className="text-red-500">*</span>
            </label>
            <select
              name="position"
              value={state.position}
              onChange={handleInputChange}
              required
              disabled={!state.designation}
              className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none disabled:bg-gray-50"
            >
              <option value="">Select Position</option>
              {state.designation &&
                designations[
                  state.designation as keyof typeof designations
                ].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Employment Status<span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={state.status}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="Permanent">Permanent</option>
              <option value="Job Order">Job Order</option>
              <option value="Casual">Casual</option>
              <option value="PGT Employee">PGT Employee</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Hired Date<span className="text-red-500">*</span>
            </label>
            <input
              name="hired_date"
              type="date"
              value={state.hired_date}
              onChange={handleInputChange}
              required
              className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 border-t border-gray-100 pt-4">
            <label className="text-sm font-bold text-purple-600 uppercase mb-3 block">
              Government IDs (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  PHILHEALTH No.
                </label>
                <input
                  name="philhealth_no"
                  value={state.philhealth_no}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  TIN
                </label>
                <input
                  name="tin"
                  value={state.tin}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  SSS No.
                </label>
                <input
                  name="sss_no"
                  value={state.sss_no}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  PAG-IBIG MID
                </label>
                <input
                  name="pag_ibig_mid_no"
                  value={state.pag_ibig_mid_no}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  PAG-IBIG RTN
                </label>
                <input
                  name="pag_ibig_rtn"
                  value={state.pag_ibig_rtn}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  GSIS No.
                </label>
                <input
                  name="gsis_no"
                  value={state.gsis_no}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-purple-600 text-white rounded-lg py-3 font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {registerMutation.isPending ? "Registering..." : "Register Now"}
          </button>
        </div>
      </form>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
};
