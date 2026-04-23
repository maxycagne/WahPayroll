import { createMutation } from "../../leave/hooks/createMutationHandler";
import { register } from "../api/register";
import { RegisterCredentials, RegisterResponse } from "../types";

type ShowToastFn = (message: any, type?: string, duration?: number) => void;

export const useRegister = (showToast: ShowToastFn) => {

  return createMutation<RegisterResponse, RegisterCredentials>({
    mutationFn: register,
    successMsg:
      "Account created successfully. Await Admin/HR approval before logging in.",
    invalidateKeys: [],
    showToast: (msg, type) => {
      const toastType = typeof type === "string" ? type : "success";
      const duration = toastType === "success" ? 0 : undefined;
      showToast(msg, toastType, duration);
    },
  });
};
