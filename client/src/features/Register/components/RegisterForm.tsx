import { useEffect, useReducer, useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { RegisterCredentials } from "../types";
import { useRegister } from "../hooks/useRegister";
import { initialState, registerReducer } from "../registerReducer";
import { validateForm, ValidationErrors } from "../utils/validation";

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
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const registerMutation = useRegister(showToast);

  // Update validation errors whenever form state changes
  useEffect(() => {
    const validationErrors = validateForm(state);
    setErrors(validationErrors);
  }, [state]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched on submit
    const allTouched: Record<string, boolean> = {};
    Object.keys(state).forEach(key => { allTouched[key] = true; });
    setTouched(allTouched);

    const validationErrors = validateForm(state);
    const hasErrors = Object.values(validationErrors).some(err => err !== null);

    if (hasErrors) {
      showToast("Please fix the errors in the form before submitting.", "error");
      return;
    }

    // Remove emp_id from data before sending
    const { emp_id, ...data } = state;
    registerMutation.mutate(data as any);
  };

  const renderError = (field: string) => {
    if (touched[field] && errors[field]) {
      return <p className="mt-1 text-[10px] text-red-500 font-bold m-0">{errors[field]}</p>;
    }
    return null;
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={state.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              maxLength={50}
              className={`border rounded-lg p-2.5 outline-none transition-all ${touched.email && errors.email ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-purple-500'}`}
            />
            {renderError("email")}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={state.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                minLength={6}
                className={`w-full border rounded-lg p-2.5 pr-10 outline-none transition-all ${touched.password && errors.password ? "border-red-400 ring-1 ring-red-200" : "border-gray-300 focus:ring-2 focus:ring-purple-500"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {renderError("password")}
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
                onBlur={handleBlur}
                required
                maxLength={30}
                className={`border rounded-lg p-2.5 outline-none transition-all ${touched.first_name && errors.first_name ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-purple-500'}`}
              />
              {renderError("first_name")}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                M.I.
              </label>
              <input
                name="middle_initial"
                value={state.middle_initial}
                onChange={handleInputChange}
                onBlur={handleBlur}
                maxLength={1}
                className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                name="last_name"
                value={state.last_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                maxLength={30}
                className={`border rounded-lg p-2.5 outline-none transition-all ${touched.last_name && errors.last_name ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-purple-500'}`}
              />
              {renderError("last_name")}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Designation <span className="text-red-500">*</span>
            </label>
            <select
              name="designation"
              value={state.designation}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              className={`border rounded-lg p-2.5 outline-none transition-all ${touched.designation && errors.designation ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-purple-500'}`}
            >
              <option value="">Select Designation</option>
              {Object.keys(designations).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {renderError("designation")}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Position <span className="text-red-500">*</span>
            </label>
            <select
              name="position"
              value={state.position}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              disabled={!state.designation}
              className={`border rounded-lg p-2.5 outline-none transition-all ${touched.position && errors.position ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50'}`}
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
            {renderError("position")}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Employment Status
            </label>
            <select
              name="status"
              value={state.status}
              onChange={handleInputChange}
              onBlur={handleBlur}
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
              Hired Date <span className="text-red-500">*</span>
            </label>
            <input
              name="hired_date"
              type="date"
              value={state.hired_date}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              className={`border rounded-lg p-2.5 outline-none transition-all ${touched.hired_date && errors.hired_date ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-purple-500'}`}
            />
            {renderError("hired_date")}
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
                  onBlur={handleBlur}
                  className={`border rounded-lg p-2 outline-none transition-all ${touched.philhealth_no && errors.philhealth_no ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-1 focus:ring-purple-500'}`}
                />
                {renderError("philhealth_no")}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  TIN
                </label>
                <input
                  name="tin"
                  value={state.tin}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`border rounded-lg p-2 outline-none transition-all ${touched.tin && errors.tin ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-1 focus:ring-purple-500'}`}
                />
                {renderError("tin")}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  SSS No.
                </label>
                <input
                  name="sss_no"
                  value={state.sss_no}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`border rounded-lg p-2 outline-none transition-all ${touched.sss_no && errors.sss_no ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-1 focus:ring-purple-500'}`}
                />
                {renderError("sss_no")}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  PAG-IBIG MID
                </label>
                <input
                  name="pag_ibig_mid_no"
                  value={state.pag_ibig_mid_no}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`border rounded-lg p-2 outline-none transition-all ${touched.pag_ibig_mid_no && errors.pag_ibig_mid_no ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-1 focus:ring-purple-500'}`}
                />
                {renderError("pag_ibig_mid_no")}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  PAG-IBIG RTN
                </label>
                <input
                  name="pag_ibig_rtn"
                  value={state.pag_ibig_rtn}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`border rounded-lg p-2 outline-none transition-all ${touched.pag_ibig_rtn && errors.pag_ibig_rtn ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-1 focus:ring-purple-500'}`}
                />
                {renderError("pag_ibig_rtn")}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  GSIS No.
                </label>
                <input
                  name="gsis_no"
                  value={state.gsis_no}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`border rounded-lg p-2 outline-none transition-all ${touched.gsis_no && errors.gsis_no ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:ring-1 focus:ring-purple-500'}`}
                />
                {renderError("gsis_no")}
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
