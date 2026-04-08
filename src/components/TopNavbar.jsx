import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { serverURL } from "../App";
import { FaBell, FaEnvelope, FaUserCircle, FaSignOutAlt, FaComments, FaTrash } from "react-icons/fa";

function TopNavbar({ title = null }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || "guest";
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasActiveEvent, setHasActiveEvent] = useState(false);

  const profilePath =
    role === "host"
      ? "/host/profile"
      : role === "organizer"
      ? "/organizer/profile"
      : role === "gig"
      ? "/gig/profile"
      : "/login";
  const dashboardPath =
    role === "host"
      ? "/host/dashboard"
      : role === "organizer"
      ? "/organizer/dashboard"
      : role === "gig"
      ? "/gig/dashboard"
      : "/";
  const chatPath =
    role === "host"
      ? "/host/chat"
      : role === "organizer"
      ? "/organizer/chat"
      : role === "gig"
      ? "/gig/chat"
      : "/";

  const fetchNotifications = async () => {
    if (!["host", "organizer", "gig"].includes(role)) return;
    try {
      const rolePath = role === "gig" ? "gigs" : role;
      const res = await axios.get(`${serverURL}/${rolePath}/notifications`, { withCredentials: true });
      const items = res.data?.data || [];
      const unread = items.filter((n) => !n.read).length;
      setNotifications(items);
      setUnreadCount(unread);
    } catch (e) {
      // silently ignore
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [role]);

  useEffect(() => {
    const loadActiveEvent = async () => {
      if (role !== "gig") return;
      try {
        const res = await axios.get(`${serverURL}/gigs/attendance-history`, { withCredentials: true });
        const history = res.data?.data || [];
        const active = Array.isArray(history) && history.some((h) => h?.check_in_time && !h?.check_out_time);
        setHasActiveEvent(active);
      } catch {
        setHasActiveEvent(false);
      }
    };
    loadActiveEvent();
    const interval = setInterval(loadActiveEvent, 60000);
    return () => clearInterval(interval);
  }, [role]);

  const markNotificationRead = async (id) => {
    try {
      if (role === "gig") {
        // Gig doesn't have a read endpoint; just close and update UI locally
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
        return;
      }
      const rolePath = role === "gig" ? "gigs" : role;
      await axios.put(`${serverURL}/${rolePath}/notifications/${id}/read`, {}, { withCredentials: true });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    if (role === "gig") {
      setNotifOpen(false);
      return;
    }
    const unread = notifications.filter((n) => !n.read);
    try {
      await Promise.all(
        unread.map((n) =>
          axios.put(`${serverURL}/${role}/notifications/${n._id}/read`, {}, { withCredentials: true })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
    setNotifOpen(false);
  };

  const deleteNotification = async (id) => {
    try {
      const rolePath = role === "gig" ? "gigs" : role;
      await axios.delete(`${serverURL}/${rolePath}/notifications/${id}`, { withCredentials: true });
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {}
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(dashboardPath)}
              className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent"
              aria-label="Go to Dashboard"
            >
              EventFlex
            </button>
            {title && <span className="text-gray-300">|</span>}
            {title && <span className="text-sm text-gray-700">{title}</span>}
          </div>

          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="hidden sm:flex flex-col items-start">
              <div className="flex items-center space-x-2 text-gray-700">
                <FaEnvelope className="text-purple-600" />
                <span className="text-sm">{user?.email || "Not logged in"}</span>
              </div>
              <span className="text-xs text-gray-500 capitalize">{role}</span>
            </div>

            {/* Conversation icon (left of notifications) */}
            <button
              onClick={() => navigate(chatPath)}
              title="Conversations"
              className="text-gray-600 hover:text-purple-600 transition-colors"
              aria-label="Conversations"
            >
              <FaComments className="text-xl" />
            </button>

            <div className="relative">
              <button
                title="Notifications"
                className="text-gray-600 hover:text-purple-600 transition-colors"
                aria-label="Notifications"
                onClick={async () => {
                  const next = !notifOpen;
                  setNotifOpen(next);
                  if (next) {
                    await fetchNotifications();
                  }
                }}
              >
                <FaBell className="text-xl" />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 block w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-semibold text-slate-900">Notifications</span>
                    <button
                      onClick={markAllRead}
                      className="text-xs text-purple-600 hover:text-purple-700"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-slate-500">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          onClick={async () => {
                            await markNotificationRead(n._id);
                            setNotifOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-purple-50 transition flex items-start gap-2"
                        >
                          <span
                            className={`mt-1 inline-block w-2 h-2 rounded-full ${
                              n.read ? "bg-slate-300" : "bg-red-500"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="text-sm text-slate-900">{n.message}</div>
                            <div className="text-xs text-slate-500">
                              {new Date(n.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <span className="text-[10px] uppercase text-slate-500">{n.type}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n._id);
                            }}
                            className="ml-2 text-gray-400 hover:text-red-600"
                            aria-label="Delete notification"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(profilePath)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Open Profile"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <FaUserCircle className="text-2xl text-gray-700" />
              )}
            </button>

            <button
              onClick={logout}
              className="hidden sm:flex items-center space-x-2 text-red-600 hover:text-red-700 font-semibold text-sm"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      {role === "gig" && (
        <div className="absolute -bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <button
            onClick={() => navigate("/gig/attendance")}
            className={`pointer-events-auto px-4 py-2 rounded-full border ${hasActiveEvent ? "border-green-600 bg-green-50 animate-pulse" : "border-gray-300 bg-white"} text-sm text-gray-800 shadow`}
            title="Active Event"
          >
            {hasActiveEvent ? "Active Event" : "No Active Event"}
          </button>
        </div>
      )}
    </header>
  );
}

export default TopNavbar;
