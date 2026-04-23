export type RegisterCredentials = {
  emp_id: string;
  first_name: string;
  middle_initial?: string;
  last_name: string;
  designation?: string;
  position?: string;
  status?: string;
  email: string;
  password?: string;
  philhealth_no?: string;
  tin?: string;
  sss_no?: string;
  pag_ibig_mid_no?: string;
  pag_ibig_rtn?: string;
  gsis_no?: string;
  hired_date?: string;
};

export type RegisterResponse = {
  message: string;
};
