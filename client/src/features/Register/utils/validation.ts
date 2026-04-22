export const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return "Invalid email format";
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  // Optional: add more complexity checks
  // if (!/[A-Z]/.test(password)) return "Must contain at least one uppercase letter";
  // if (!/[0-9]/.test(password)) return "Must contain at least one number";
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === "") return `${fieldName} is required`;
  return null;
};

export const validateName = (value: string, fieldName: string): string | null => {
  const requiredErr = validateRequired(value, fieldName);
  if (requiredErr) return requiredErr;
  if (value.length < 2) return `${fieldName} must be at least 2 characters`;
  if (/[0-9]/.test(value)) return `${fieldName} cannot contain numbers`;
  return null;
};

export const validateGovernmentId = (value: string, fieldName: string): string | null => {
  if (!value) return null; // Optional fields
  // Basic format check for most PH government IDs (hyphens and numbers)
  const re = /^[0-9-]+$/;
  if (!re.test(value)) return `${fieldName} should only contain numbers and hyphens`;
  return null;
};

export interface ValidationErrors {
  [key: string]: string | null;
}

export const validateForm = (data: any): ValidationErrors => {
  const errors: ValidationErrors = {};

  errors.email = validateEmail(data.email);
  errors.password = validatePassword(data.password);
  errors.first_name = validateName(data.first_name, "First Name");
  errors.last_name = validateName(data.last_name, "Last Name");
  errors.designation = validateRequired(data.designation, "Designation");
  errors.position = validateRequired(data.position, "Position");
  errors.hired_date = validateRequired(data.hired_date, "Hired Date");

  // Optional fields
  errors.philhealth_no = validateGovernmentId(data.philhealth_no, "PhilHealth No.");
  errors.tin = validateGovernmentId(data.tin, "TIN");
  errors.sss_no = validateGovernmentId(data.sss_no, "SSS No.");
  errors.pag_ibig_mid_no = validateGovernmentId(data.pag_ibig_mid_no, "Pag-IBIG MID");
  errors.pag_ibig_rtn = validateGovernmentId(data.pag_ibig_rtn, "Pag-IBIG RTN");
  errors.gsis_no = validateGovernmentId(data.gsis_no, "GSIS No.");

  return errors;
};
