import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { Eye, EyeOff } from "lucide-react"; // <-- Added Eye and EyeOff
import SettingsNav from "@/features/settings/components/SettingsNav";
import PublicProfile from "@/features/settings/components/PublicProfile";
import { useFetcher } from "react-router-dom";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import axiosInterceptor from "@/hooks/interceptor";

export default function Settings() {
  const { toast, showToast, clearToast } = useToast();

  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("wah_user") || "{}"),
  );
  const [profileForm, setProfileForm] = useState({
    email: "",
    profile_photo: "",
  });

  useEffect(() => {
    if (!currentUser) return;
    console.log(currentUser);
    setProfileForm({
      email: currentUser.email || "",
      profile_photo: currentUser.profile_photo || "",
    });
  }, [currentUser]);
  const displayFirstName = useMemo(() => {
    return (
      currentUser?.first_name ||
      (currentUser?.name ? currentUser.name.split(" ")[0] : "")
    );
  }, [currentUser]);

  const displayLastName = useMemo(
    () =>
      currentUser?.last_name ||
      (currentUser?.name ? currentUser.name.split(" ").slice(1).join(" ") : ""),
    [currentUser],
  );

  const [activeTab, setActiveTab] = useState("profile");

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

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append("email", data.email);
      if (data.profile_photo instanceof File) {
        formData.append("profile_photo", data.profile_photo);
      }

      return mutationHandler(
        axiosInterceptor.put("/api/me/profile", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }),
        "Error updating profile",
      );
    },
    onSuccess: (response, variables) => {
      const oldUser = JSON.parse(localStorage.getItem("wah_user") || "null");

      const updatedUser = {
        ...oldUser,
        email: variables.email,
        ...(response?.user?.profile_photo && {
          profile_photo: response.user.profile_photo,
        }),
      };

      localStorage.setItem("wah_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setProfileForm({
        email: updatedUser.email || "",
        profile_photo: updatedUser.profile_photo || "",
      });

      showToast("Profile updated successfully.");
    },
    onError: (e) => showToast(e.message, "error"),
  });

  // Password Change Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiFetch(`/api/employees/me/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Failed to change password");
      return result;
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

  const updateProfile = (e) => {
    e.preventDefault();

    updateProfileMutation.mutate(profileForm);
  };
  return (
    <div className="max-w-4xl mx-auto w-full">
      <h1 className="mb-6 text-[1.4rem] font-bold text-gray-900">
        Account Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <SettingsNav
          setActiveTab={setActiveTab}
          activeTab={activeTab}
        ></SettingsNav>

        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 animate-in fade-in duration-200">
            {activeTab === "profile" && (
              <PublicProfile
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                updateProfile={updateProfile}
                displayFirstName={displayFirstName}
                displayLastName={displayLastName}
              ></PublicProfile>
            )}

            {activeTab === "security" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                  Change Password
                </h3>
                <form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4 max-w-md"
                >
                  {/* --- Current Password --- */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Current Password
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
                        className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword.current ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* --- New Password --- */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      New Password
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
                        className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("new")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword.new ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* --- Confirm New Password --- */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Confirm New Password
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
                        className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirm")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword.confirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
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
          </div>
        </div>
      </div>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
