import axiosInterceptor from "./interceptor";
const STORAGE_TOKEN_KEY = "wah_token";
const STORAGE_USER_KEY = "wah_user";
export const logout = async () => {
  try {
    await axiosInterceptor.post("/api/auth/logout");
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    window.location.href = "/";
  }
};
