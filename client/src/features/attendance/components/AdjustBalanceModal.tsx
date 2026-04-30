import React from "react";

interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  empName: string;
  type: string;
  setType: (val: string) => void;
  days: string;
  setDays: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  isOpen,
  onClose,
  empName,
  type,
  setType,
  days,
  setDays,
  onSubmit,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-lg font-bold m-0">Adjust Leave Balance</h2>
            <p className="m-0 text-xs text-white/80">{empName}</p>
          </div>
          <button onClick={onClose} className="text-white text-2xl border-0 bg-transparent cursor-pointer">&times;</button>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="flex flex-col gap-4">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Subtract">Subtract Days (Minus)</option>
              <option value="Add">Add Days (Plus)</option>
            </select>
            <input
              type="number"
              min="0.5"
              step="0.5"
              required
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Number of days"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-purple-700 text-white rounded-lg font-bold border-0 cursor-pointer hover:bg-purple-800 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
