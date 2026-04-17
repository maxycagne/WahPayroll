import { Camera, User } from "lucide-react";
import { useRef } from "react";

const PublicProfile = ({
  profileForm,
  setProfileForm,
  updateProfile,
  displayFirstName,
  displayLastName,
  isMutating,
}) => {
  const fileInputRef = useRef();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
        Public Profile
      </h3>

      <form onSubmit={updateProfile} className="space-y-4">
        <div className="flex items-center gap-5 mb-8">
          <div className="relative h-20 w-20 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
            {profileForm.profile_photo ? (
              <img alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                e.preventDefault();
                if (!e.target.files) return;

                console.log(e.target.files[0]);
                setProfileForm({
                  ...profileForm,
                  profile_photo: e.target.files[0],
                });
              }}
            />
            {profileForm.profile_photo}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Update Profile
              <Camera className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-gray-500 mt-2">
              JPG, PNG or WEBP. Max size 2MB.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              First Name
            </label>
            <input
              type="text"
              disabled
              value={displayFirstName || ""}
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
              value={displayLastName || ""}
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
            disabled={isMutating}
            className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isMutating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicProfile;
