import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axiosInterceptor from "../hooks/interceptor";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { Camera, Lock, User, Eye, EyeOff, CreditCard, Moon, Sun, Palette } from "lucide-react"; // <-- Added Moon, Sun, Palette
import { useThemeStore } from "../store/useThemeStore";

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore();
  const { toast, showToast, clearToast } = useToast();
  const fileInputRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("wah_user") || "{}"),
  );
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const displayFirstName =
    currentUser?.first_name ||
    (currentUser?.name ? currentUser.name.split(" ")[0] : "");
  const displayLastName =
    currentUser?.last_name ||
    (currentUser?.name ? currentUser.name.split(" ").slice(1).join(" ") : "");

  const [activeTab, setActiveTab] = useState("profile");

  // State for forms
  const [profileForm, setProfileForm] = useState({
    email: currentUser.email || "",
  });

  const [credentialsForm, setCredentialsForm] = useState({
    philhealth_no: currentUser.philhealth_no || "",
    tin: currentUser.tin || "",
    sss_no: currentUser.sss_no || "",
    pag_ibig_mid_no: currentUser.pag_ibig_mid_no || "",
    gsis_no: currentUser.gsis_no || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // --- NEW: State to track password visibility ---
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Photo Upload Mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("profile_photo", file);
      return mutationHandler(
        axiosInterceptor.post("/api/employees/me/photo", formData),
        "Failed to upload photo",
      );
    },
    onSuccess: (data) => {
      const updatedUser = { ...currentUser, profile_photo: data.filePath };
      localStorage.setItem("wah_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      showToast("Profile photo updated successfully.");
    },
    onError: () => showToast("Error uploading photo.", "error"),
  });

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      return mutationHandler(
        axiosInterceptor.put("/api/employees/me/profile", data),
        "Failed to update profile",
      );
    },
    onSuccess: (data, variables) => {
      const updatedUser = { ...currentUser, ...variables };
      localStorage.setItem("wah_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      showToast("Profile updated successfully.");
    },
    onError: () => showToast("Error updating profile.", "error"),
  });

  // Password Change Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      return mutationHandler(
        axiosInterceptor.put("/api/employees/me/change-password", data),
        "Failed to change password",
      );
    },
    onSuccess: () => {
      showToast("Password changed successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadPhotoMutation.mutate(file);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <h1 className="mb-6 text-[1.4rem] font-bold text-gray-900 dark:text-gray-100">
        Account Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "profile"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "security"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Lock className="w-4 h-4" /> Security
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "credentials"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Credentials
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "appearance"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Palette className="w-4 h-4" /> Appearance
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 animate-in fade-in duration-200">
            {activeTab === "profile" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
                  Public Profile
                </h3>

                {/* Details Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateProfileMutation.mutate(profileForm);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        First Name
                      </label>
                      <input
                        type="text"
                        disabled
                        value={displayFirstName}
                        className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Last Name
                      </label>
                      <input
                        type="text"
                        disabled
                        value={displayLastName}
                        className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          email: e.target.value,
                        })
                      }
                      className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {updateProfileMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
                  Change Password
                </h3>
                <form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4 max-w-md"
                >
                  {/* --- Current Password --- */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Current Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? "text" : "password"}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword.current ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* --- New Password --- */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      New Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        required
                        minLength={6}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("new")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword.new ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* --- Confirm New Password --- */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Confirm New Password
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        required
                        minLength={6}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirm")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword.confirm ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {changePasswordMutation.isPending
                        ? "Updating..."
                        : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}
            {activeTab === "credentials" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
                  Government Credentials
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateProfileMutation.mutate(credentialsForm);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        PHILHEALTH No.
                      </label>
                      <input
                        type="text"
                        placeholder="N/A"
                        value={credentialsForm.philhealth_no}
                        onChange={(e) =>
                          setCredentialsForm({
                            ...credentialsForm,
                            philhealth_no: e.target.value,
                          })
                        }
                        className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        TIN
                      </label>
                      <input
                        type="text"
                        placeholder="N/A"
                        value={credentialsForm.tin}
                        onChange={(e) =>
                          setCredentialsForm({
                            ...credentialsForm,
                            tin: e.target.value,
                          })
                        }
                        className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        SSS No.
                      </label>
                      <input
                        type="text"
                        placeholder="N/A"
                        value={credentialsForm.sss_no}
                        onChange={(e) =>
                          setCredentialsForm({
                            ...credentialsForm,
                            sss_no: e.target.value,
                          })
                        }
                        className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        PAG-IBIG MID No.
                      </label>
                      <input
                        type="text"
                        placeholder="N/A"
                        value={credentialsForm.pag_ibig_mid_no}
                        onChange={(e) =>
                          setCredentialsForm({
                            ...credentialsForm,
                            pag_ibig_mid_no: e.target.value,
                          })
                        }
                        className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        GSIS No.
                      </label>
                      <input
                        type="text"
                        placeholder="N/A"
                        value={credentialsForm.gsis_no}
                        onChange={(e) =>
                          setCredentialsForm({
                            ...credentialsForm,
                            gsis_no: e.target.value,
                          })
                        }
                        className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {updateProfileMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}
            {activeTab === "appearance" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
                  Appearance Settings
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 block">
                      Theme Preference
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => theme !== "light" && toggleTheme()}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          theme === "light"
                            ? "border-purple-600 bg-purple-50/50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${theme === "light" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                            <Sun className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-bold ${theme === "light" ? "text-purple-900 dark:text-purple-100" : "text-gray-900 dark:text-gray-100"}`}>Light Mode</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Classic bright look</p>
                          </div>
                        </div>
                        {theme === "light" && (
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </button>

                      <button
                        onClick={() => theme !== "dark" && toggleTheme()}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          theme === "dark"
                            ? "border-purple-600 bg-purple-50/50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                            <Moon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-bold ${theme === "dark" ? "text-purple-900 dark:text-purple-100" : "text-gray-900 dark:text-gray-100"}`}>Dark Mode</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Easier on the eyes</p>
                          </div>
                        </div>
                        {theme === "dark" && (
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
