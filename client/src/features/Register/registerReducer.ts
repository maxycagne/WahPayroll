import { RegisterCredentials } from "./types";

export type RegisterAction =
  | { type: "UPDATE_FIELD"; field: keyof RegisterCredentials; value: any }
  | { type: "RESET_FORM" };

export const initialState: RegisterCredentials = {
  emp_id: "", // We'll keep the type for now but remove it from the form
  first_name: "",
  middle_initial: "",
  last_name: "",
  designation: "",
  position: "",
  status: "Permanent",
  email: "",
  password: "",
  philhealth_no: "",
  tin: "",
  sss_no: "",
  pag_ibig_mid_no: "",
  pag_ibig_rtn: "",
  gsis_no: "",
  dob: "",
  hired_date: "",
};

export const registerReducer = (state: RegisterCredentials, action: RegisterAction): RegisterCredentials => {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };
    case "RESET_FORM":
      return initialState;
    default:
      return state;
  }
};
