import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import { apiFetch } from "../lib/api";

export default function MainLayout({ role, onLogout }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openNotifications, setOpenNotifications] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiFetch("/api/employees/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => n.status === "Unread").length;

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/employees/notifications/${id}/read`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/employees/notifications/read-all", {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const handleNotificationClick = (item) => {
    const referenceType = String(item?.reference_type || "").toLowerCase();
    const tabByReference = {
      leave: "leave",
      offset: "offset",
      resignation: "resignation",
    };

    const tab = tabByReference[referenceType] || "leave";
    const params = new URLSearchParams({ tab });

    if (item?.reference_id !== null && item?.reference_id !== undefined) {
      params.set("requestId", String(item.reference_id));
    }

    if (item.status === "Unread") {
      markReadMutation.mutate(item.id);
    }

    navigate(`/leave?${params.toString()}`);
    setOpenNotifications(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-7 py-3 bg-gradient-to-r from-wah-topbar-start to-wah-topbar-end sticky top-0 z-20">
        <h2 className="m-0 flex items-baseline gap-2">
          <span className="text-white text-[0.95rem] font-extrabold uppercase tracking-wide">
            WIRELESS ACCESS FOR HEALTH
          </span>
          <span className="text-white/70 text-[0.78rem] font-normal uppercase tracking-wider">
            PAYROLL.
          </span>
        </h2>
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpenNotifications((prev) => !prev)}
            className="relative h-8 w-8 rounded-full border border-white/35 text-white hover:bg-white/10"
            aria-label="Notifications"
          >
            <span className="text-sm">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {openNotifications && (
            <div className="absolute right-0 top-10 w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-30">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="m-0 text-sm font-bold text-gray-900">Notifications</h3>
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs font-semibold text-purple-700 bg-transparent border-0 cursor-pointer"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="m-0 px-4 py-4 text-sm text-gray-500">No notifications yet.</p>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className={`w-full text-left border-0 bg-transparent px-4 py-3 cursor-pointer hover:bg-gray-50 ${item.status === "Unread" ? "bg-purple-50/40" : ""}`}
                    >
                      <p className="m-0 text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="m-0 text-xs text-gray-600 mt-1">{item.message}</p>
                      <p className="m-0 text-[11px] text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <span className="text-[0.78rem] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border border-white/35 text-white/90">
            {role}
          </span>
        </div>
      </header>
      <div className="grid grid-cols-[200px_1fr] flex-1">
        <Sidebar role={role} onLogout={onLogout} />
        <main className="flex-1 p-5 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
