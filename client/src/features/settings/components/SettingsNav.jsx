import { Lock, User } from "lucide-react";

const SettingsNav = ({ setActiveTab, activeTab }) => {
  return (
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
  );
};

export default SettingsNav;
