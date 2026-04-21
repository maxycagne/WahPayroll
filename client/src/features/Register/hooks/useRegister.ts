import { createMutation } from "../../leave/hooks/createMutationHandler";
import { register } from "../api/register";
import { RegisterCredentials, RegisterResponse } from "../types";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/useToast";

export const useRegister = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  return createMutation<RegisterResponse, RegisterCredentials>({
    mutationFn: register,
    successMsg: "Registration submitted for approval! You can log in once approved.",
    invalidateKeys: [],
    showToast: (msg, type) => showToast(msg, "", type as any),
    successExtra: () => {
      navigate("/login");
    },
  });
};
