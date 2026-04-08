import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import { getCardImage, getEventTypeImage } from "../../utils/imageMaps.js";
import {
  FaCalendarAlt,
  FaUsers,
  FaWallet,
  FaSignOutAlt,
  FaUserCircle,
  FaPlus,
  FaSearch,
  FaBell,
  FaArrowRight,
  FaComments,
} from "react-icons/fa";
import TopNavbar from "../../components/TopNavbar.jsx";

function HostDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [invites, setInvites] = useState([]);
  const [assignedPools, setAssignedPools] = useState([]);
  const [poolForm, setPoolForm] = useState({ open: false, organizerId: "", eventId: "", pool_name: "", max_capacity: 10, required_skills: "", pay_min: "", pay_max: "", lat: "", lng: "" });

  useEffect(() => {
    fetchDashboardData();
    fetchInvitesAndPools();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${serverURL}/host/dashboard`, {
        withCredentials: true,
      });
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard");
      
      // If unauthorized, logout
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const fetchInvitesAndPools = async () => {
    try {
      const [invRes, poolsRes] = await Promise.all([
        axios.get(`${serverURL}/host/organizers/invites`, { withCredentials: true }),
        axios.get(`${serverURL}/host/organizer`, { withCredentials: true }),
      ]);
      setInvites(invRes.data?.data || []);
      setAssignedPools(poolsRes.data?.data || []);
    } catch (e) {
      console.warn("Failed to load invites or pools", e.message);
    }
  };

  const approveApplication = async (appId) => {
    try {
      await axios.post(`${serverURL}/host/approve-organizer/${appId}`, {}, { withCredentials: true });
      await fetchInvitesAndPools();
      await fetchDashboardData();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to approve organizer");
    }
  };

  const rejectApplication = async (appId) => {
    try {
      await axios.post(`${serverURL}/host/reject-organizer/${appId}`, {}, { withCredentials: true });
      await fetchInvitesAndPools();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to reject organizer");
    }
  };

  const openPoolForm = (organizerId, eventId) => {
    setPoolForm((f) => ({ ...f, open: true, organizerId, eventId }));
  };

  const createPool = async () => {
    const payMin = parseFloat(poolForm.pay_min);
    const payMax = parseFloat(poolForm.pay_max);
    if (!poolForm.pool_name || !poolForm.organizerId || !poolForm.eventId) {
      setError("Provide pool name and linked organizer/event");
      return;
    }
    if (isNaN(payMin) || isNaN(payMax)) {
      setError("Enter valid pay range");
      return;
    }
    const lat = parseFloat(poolForm.lat);
    const lng = parseFloat(poolForm.lng);
    if (isNaN(lat) || isNaN(lng)) {
      setError("Enter valid location coordinates");
      return;
    }
    try {
      const payload = {
        organizerId: poolForm.organizerId,
        eventId: poolForm.eventId,
        pool_name: poolForm.pool_name,
        location: { coordinates: [lng, lat] },
        max_capacity: Number(poolForm.max_capacity) || 10,
        required_skills: poolForm.required_skills,
        pay_range: { min: payMin, max: payMax },
      };
      await axios.post(`${serverURL}/host/pools/create`, payload, { withCredentials: true });
      setPoolForm({ open: false, organizerId: "", eventId: "", pool_name: "", max_capacity: 10, required_skills: "", pay_min: "", pay_max: "", lat: "", lng: "" });
      await fetchInvitesAndPools();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create organizer pool");
    }
  };

  // Note: Payments & Wallet actions are available on the dedicated Payments page

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const { events = [], escrows = [], payments = [] } = dashboardData || {};
  const recentEvents = [...events]
    .filter(e => ['active', 'in_progress', 'completed'].includes(e.status))
    .sort((a, b) => {
      // Show active/in_progress events first
      const isActiveA = a.status === 'active' || a.status === 'in_progress';
      const isActiveB = b.status === 'active' || b.status === 'in_progress';
      
      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;
      
      // Then sort by date descending
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, 5);

  const handleDelete = async (eventId) => {
    const confirm = window.confirm("Delete this event? This action can’t be undone.");
    if (!confirm) return;
    try {
      setDeletingId(eventId);
      await axios.delete(`${serverURL}/host/events/${eventId}`, { withCredentials: true });
      setDashboardData((prev) => ({
        ...prev,
        events: (prev?.events || []).filter((e) => e._id !== eventId),
      }));
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete event";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="My Dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.first_name || "Host"}!
          </h2>
          <p className="text-gray-600">Manage your events and track your activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">{events.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <FaCalendarAlt className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Active Escrows</p>
                <p className="text-3xl font-bold text-gray-900">
                  {escrows.filter((e) => e.status !== "released").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaWallet className="text-indigo-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Payments</p>
                <p className="text-3xl font-bold text-gray-900">{payments.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <FaUsers className="text-pink-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Features</h3>
          {(() => {
            const actions = [
              {
                title: "Create Event",
                description: "Plan and publish a new event",
                path: "/host/events/create",
                image: getCardImage("createEvent"),
                color: "from-purple-600/50 via-indigo-600/40 to-pink-600/30",
                icon: <FaCalendarAlt className="text-2xl" />,
              },
              {
                title: "Find Organizers",
                description: "Search and invite organizers",
                path: "/host/organizers",
                image: getCardImage("findOrganizers"),
                color: "from-indigo-600/50 via-purple-600/40 to-pink-600/30",
                icon: <FaUsers className="text-2xl" />,
              },
              {
                title: "My Events",
                description: "Track active, upcoming & completed events",
                path: "/host/my-events",
                image: getCardImage("gigMyEvents"),
                color: "from-green-600/50 via-teal-600/40 to-emerald-600/30",
                icon: <FaCalendarAlt className="text-2xl" />,
              },
              {
                title: "Organizer Status",
                description: "Track invites and requests",
                path: "/host/status",
                image: getCardImage("organizerStatus"),
                color: "from-purple-600/50 via-indigo-600/40 to-pink-600/30",
                icon: <FaUsers className="text-2xl" />,
              },
              {
                title: "Organizer Pools",
                description: "Create and assign organizer pools",
                path: "/host/pools",
                image: getCardImage("organizerPools"),
                color: "from-indigo-600/50 via-purple-600/40 to-pink-600/30",
                icon: <FaUsers className="text-2xl" />,
              },
              {
                title: "Payments",
                description: "Manage wallet, escrow and payouts",
                path: "/host/payments",
                image: getCardImage("payments"),
                color: "from-pink-600/40 via-indigo-600/40 to-purple-600/30",
                icon: <FaWallet className="text-2xl" />,
              }
            ];

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {actions.map((action) => (
                  <div
                    key={action.title}
                    onClick={() => navigate(action.path)}
                    role="button"
                    tabIndex={0}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={action.image}
                        alt={action.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${action.color} opacity-60`}></div>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg text-purple-600">
                        {action.icon}
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{action.title}</h4>
                      <p className="text-gray-600 mb-4">{action.description}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(action.path);
                        }}
                        className="flex items-center text-purple-600 font-semibold hover:text-indigo-600 transition-colors"
                      >
                        Open <FaArrowRight className="ml-2" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Payments moved: use the Payments page for wallet and escrow actions */}
        {/* Recent Events */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Recent Events</h3>
            <button
              onClick={() => navigate("/host/events")}
              className="text-purple-600 hover:text-indigo-600 font-semibold"
            >
              View All
            </button>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No events yet</p>
              <button
                onClick={() => navigate("/host/events/create")}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div
                  key={event._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 gap-4"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={getEventTypeImage(event.event_type)}
                        alt={event.event_type || "Event"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(event.start_date).toLocaleDateString()} -{" "}
                        {new Date(event.end_date).toLocaleDateString()}
                      </p>
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          event.status === "completed" 
                            ? "bg-gray-100 text-gray-800"
                            : event.status === "in_progress" 
                            ? "bg-green-100 text-green-800"
                            : event.status === "published"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.status === "in_progress" ? "Active" : event.status === "published" ? "Upcoming" : event.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => navigate(`/host/events/${event._id}`)}
                      className="flex-1 sm:flex-none px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition-all duration-300 text-center"
                    >
                      View
                    </button>
                    {event.status === "completed" && (
                      <button
                        onClick={() => handleDelete(event._id)}
                        disabled={deletingId === event._id}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 text-center"
                      >
                        {deletingId === event._id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      </main>

      {/* Pool creation modal */}
      {poolForm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPoolForm((f) => ({ ...f, open: false }))}></div>
          <div className="relative z-10 bg-white rounded-xl p-6 w-full max-w-lg shadow-xl m-4 sm:m-0">
            <h4 className="text-lg font-semibold mb-4">Create Organizer Pool</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input value={poolForm.pool_name} onChange={(e) => setPoolForm((f) => ({ ...f, pool_name: e.target.value }))} placeholder="Pool name" className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" min="1" value={poolForm.max_capacity} onChange={(e) => setPoolForm((f) => ({ ...f, max_capacity: e.target.value }))} placeholder="Max capacity" className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input value={poolForm.required_skills} onChange={(e) => setPoolForm((f) => ({ ...f, required_skills: e.target.value }))} placeholder="Required skills (comma-separated)" className="border rounded-lg px-3 py-2 text-sm w-full mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input type="number" value={poolForm.pay_min} onChange={(e) => setPoolForm((f) => ({ ...f, pay_min: e.target.value }))} placeholder="Pay min (₹)" className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={poolForm.pay_max} onChange={(e) => setPoolForm((f) => ({ ...f, pay_max: e.target.value }))} placeholder="Pay max (₹)" className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input type="number" value={poolForm.lat} onChange={(e) => setPoolForm((f) => ({ ...f, lat: e.target.value }))} placeholder="Lat" className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={poolForm.lng} onChange={(e) => setPoolForm((f) => ({ ...f, lng: e.target.value }))} placeholder="Lng" className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setPoolForm((f) => ({ ...f, open: false }))} className="px-3 py-2 text-sm border rounded-lg">Cancel</button>
              <button onClick={createPool} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostDashboard;
