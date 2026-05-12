export type RegistrationRequest = {
  emp_id: string; // The user-provided Employee ID (pending approval)
  first_name: string;
  middle_initial?: string;
  last_name: string;
  email: string;
  role: string;
  position: string;
  designation: string;
  status: string;
  hired_date: string;
  philhealth_no?: string;
  tin?: string;
  sss_no?: string;
  pag_ibig_mid_no?: string;
  gsis_no?: string;
};
