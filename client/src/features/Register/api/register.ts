import axiosInterceptor from "@/hooks/interceptor";
import { RegisterCredentials, RegisterResponse } from "../types";

export const register = async (data: RegisterCredentials): Promise<RegisterResponse> => {
  const response = await axiosInterceptor.post("/api/register", data);
  return response.data;
};
