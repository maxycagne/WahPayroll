import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { mutationHandler } from "@/features/leave/hooks/createMutationHandler";
import axiosInterceptor from "@/hooks/interceptor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function Settings() {
  const { toast, showToast, clearToast } = useToast();
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("wah_user") || "{}"),
  );

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
    phone: currentUser.phone || "",
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

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Profile Save Mutation (uses /api/me/profile → updateMyProfile.ts)
  const saveProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      const res = await axiosInterceptor.put("/api/me/profile", profileData);
      return res.data;
    },
    onSuccess: () => {
      const freshUser = JSON.parse(localStorage.getItem("wah_user") || "{}");
      let updatedUser = { ...freshUser };
      updatedUser.email = profileForm.email;
      localStorage.setItem("wah_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      showToast("Profile updated successfully.");
    },
    onError: (err) => showToast(err?.response?.data?.message || err.message || "Error updating profile.", "error"),
  });

  // Form submit handler — opens confirmation modal
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  // Confirmed save — actually fire the mutation
  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    saveProfileMutation.mutate(profileForm);
  };

  // Password Change Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      return mutationHandler(
        axiosInterceptor.put(`/api/employees/me/change-password`, data),
        "Failed to change password"
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
      <h1 className="mb-6 text-[1.4rem] font-bold text-gray-900">
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
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === "security"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Lock className="w-4 h-4" /> Security
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 animate-in fade-in duration-200">
            {activeTab === "profile" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                  Public Profile
                </h3>

                <form
                  onSubmit={handleProfileSubmit}
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
                        className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
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
                        className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
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
                      className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={saveProfileMutation.isPending}
                      className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {saveProfileMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
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

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Confirm Changes
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Are you sure you want to save the following changes to your profile?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">

            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-gray-700">Email: </span>
                <span className="text-gray-600">{profileForm.email}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Confirm & Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
