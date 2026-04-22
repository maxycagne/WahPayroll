export type RegistrationRequest = {
  emp_id: string; // This will be the TEMP_ ID from the server
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
  pag_ibig_rtn?: string;
  gsis_no?: string;
};
