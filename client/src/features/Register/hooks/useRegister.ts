import { createMutation } from "../../leave/hooks/createMutationHandler";
import { register } from "../api/register";
import { RegisterCredentials, RegisterResponse } from "../types";
import { useNavigate } from "react-router-dom";

type ShowToastFn = (message: any, type?: string, duration?: number) => void;

export const useRegister = (showToast: ShowToastFn) => {
  const navigate = useNavigate();

  return createMutation<RegisterResponse, RegisterCredentials>({
    mutationFn: register,
    successMsg:
      "Account created successfully. Await Admin/HR approval before logging in.",
    invalidateKeys: [],
    onSuccess: () => {
      setTimeout(() => {
        navigate("/login", {
          state: {
            registered: true,
            message:
              "Account created successfully. Your registration request is pending approval by Admin/HR before you can log in.",
          },
        });
      }, 2000);
    },
    showToast: (msg, type) => {
      const toastType = typeof type === "string" ? type : "success";
      const duration = toastType === "success" ? 0 : undefined;
      showToast(msg, toastType, duration);
    },
  });
};
