import axiosInterceptor from "@/hooks/interceptor";
import { RegistrationRequest } from "../types";

export const getPendingRequests = async (): Promise<RegistrationRequest[]> => {
  const response = await axiosInterceptor.get("/api/register/requests");
  return response.data;
};

export const approveRequest = async (id: string, data: Partial<RegistrationRequest>): Promise<{ message: string }> => {
  const response = await axiosInterceptor.put(`/api/register/approve/${id}`, data);
  return response.data;
};

export const rejectRequest = async (id: string, remarks?: string): Promise<{ message: string }> => {
  const response = await axiosInterceptor.put(`/api/register/reject/${id}`, { remarks });
  return response.data;
};
