import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";
import { FaTrash } from "react-icons/fa";

function OrganizerHostStatus() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState({ invited: [], requested: [], accepted: [], rejected: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("invited"); // invited | requested | accepted | rejected
  const [poolModal, setPoolModal] = useState({ open: false, app: null, name: "", description: "" });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/organizer/applications/summary`, { withCredentials: true });
      const data = res.data?.data || { invited: [], requested: [], accepted: [], rejected: [] };
      setSummary(data);
      setError(null);
      return data;
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load applications");
      return { invited: [], requested: [], accepted: [], rejected: [] };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    setPoolModal({ open: false, app: null, name: "", description: "" });
  }, [activeTab]);

  const invitedApps = (summary.invited || []).filter(a => a.event?.status !== 'completed') || [];
  const requestedApps = (summary.requested || []).filter(a => a.event?.status !== 'completed') || [];
  const acceptedApps = (summary.accepted || []).filter(a => a.event?.status !== 'completed') || [];
  
  // Combine originally rejected apps with pending apps from completed events
  const completedEventIds = new Set([
    ...(summary.invited || []).filter(a => a.event?.status === 'completed').map(a => a.event?._id),
    ...(summary.requested || []).filter(a => a.event?.status === 'completed').map(a => a.event?._id)
  ]);
  
  const rejectedApps = [
    ...(summary.rejected || []),
    ...(summary.invited || []).filter(a => a.event?.status === 'completed'),
    ...(summary.requested || []).filter(a => a.event?.status === 'completed')
  ];
  
  // Check if a rejected app is from a completed event
  const isRejectedFromCompletedEvent = (app) => completedEventIds.has(app.event?._id);

  const acceptInvite = async (appId) => {
    try {
      await axios.post(`${serverURL}/organizer/events/accept-invitation/${appId}`, {}, { withCredentials: true });
      const data = await fetchApplications();
      setActiveTab("accepted");
      const accepted = (data.accepted || []).find((a) => a._id === appId);
      if (accepted && !accepted.pool_exists) {
        openPoolModal(accepted);
      }
      showToast("Invitation accepted", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to accept invitation", "error");
    }
  };

  const rejectInvite = async (appId) => {
    try {
      await axios.post(`${serverURL}/organizer/events/reject-invitation/${appId}`, {}, { withCredentials: true });
      await fetchApplications();
      showToast("Invitation rejected", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to reject invitation", "error");
    }
  };

  const openPoolModal = async (app) => {
    // Check if organizer pool already exists for event to disable creation
    try {
      const r = await axios.get(`${serverURL}/organizer/org-pools/by-event/${app?.event?._id}`, { withCredentials: true });
      if (r.data?.data) {
        showToast("Pool already exists for this event", "error");
        return;
      }
    } catch (e) {
      console.warn("Pool existence check failed", e);
    }
    setPoolModal({ open: true, app, name: `Pool for ${app?.event?.title || "Event"}`, description: "Gig pool for event" });
  };

  const createPool = async () => {
    const { app, name, description } = poolModal;
    if (!name?.trim()) {
      showToast("Pool name is required", "error");
      return;
    }
    try {
      await axios.post(
        `${serverURL}/organizer/pools/create`,
        { name, eventId: app.event?._id, description },
        { withCredentials: true }
      );
      showToast("Pool created", "success");
      setPoolModal({ open: false, app: null, name: "", description: "" });
      await fetchApplications();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to create pool", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Host Invitations & Requests" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Status</h2>
            <button onClick={fetchApplications} className="px-3 py-2 text-sm border rounded-lg">Refresh</button>
          </div>
          {loading && <div className="mt-4 animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>}
          {error && <p className="text-red-600 mt-3">{error}</p>}
          <div className="mt-4 bg-gray-100 p-1 rounded-xl inline-flex">
            {["invited", "requested", "accepted", "rejected"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "invited" && (
          <div>
            {invitedApps.length === 0 ? (
              <p className="text-gray-600">No invitations.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {invitedApps.map((a) => (
                  <div key={a._id} className="w-[30%] bg-white rounded-2xl shadow overflow-hidden mb-4">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={getEventTypeImage(a?.event?.event_type)}
                      alt={a?.event?.title || "Event"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-600/30 to-pink-600/30 pointer-events-none" />
                  </div>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {a?.host?.avatar && (
                          <img src={a.host.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{a?.event?.title || "Event"}</p>
                          <p className="text-sm text-gray-600">Status: {a.application_status}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => rejectInvite(a._id)} className="px-3 py-2 text-sm border rounded-lg">Reject</button>
                        <button onClick={() => acceptInvite(a._id)} className="px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">Accept</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "requested" && (
          <div>
            {requestedApps.length === 0 ? (
              <p className="text-gray-600">No requests yet.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {requestedApps.map((a) => (
                  <div key={a._id} className="w-[30%] bg-white rounded-2xl shadow overflow-hidden mb-4">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={getEventTypeImage(a?.event?.event_type)}
                      alt={a?.event?.title || "Event"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-600/30 to-pink-600/30 pointer-events-none" />
                  </div>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {a?.organizer?.avatar && (
                          <img src={a.organizer.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{a?.event?.title || "Event"}</p>
                          <p className="text-sm text-gray-600">Status: {a.application_status}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">Awaiting host response</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "accepted" && (
          <div>
            {acceptedApps.length === 0 ? (
              <p className="text-gray-600">No accepted items yet.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {acceptedApps.map((a) => (
                  <div key={a._id} className={`w-[30%] bg-white rounded-2xl shadow overflow-hidden mb-4 ${a?.event?.status === 'completed' ? 'opacity-60 border-2 border-amber-300' : ''}`}>
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={getEventTypeImage(a?.event?.event_type)}
                      alt={a?.event?.title || "Event"}
                      className={`w-full h-full object-cover ${a?.event?.status === 'completed' ? 'grayscale' : ''}`}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-600/30 to-pink-600/30 pointer-events-none ${a?.event?.status === 'completed' ? 'from-amber-600/50 via-amber-600/40 to-amber-600/30' : ''}`} />
                    {a?.event?.status === 'completed' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-bold">EVENT COMPLETED</div>
                      </div>
                    )}
                  </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {a?.host?.avatar && (
                            <img src={a.host.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{a?.event?.title || "Event"}</p>
                            <p className="text-sm text-gray-600">Status: {a.application_status}</p>
                            {a?.event?.status === 'completed' && (
                              <p className="text-xs text-amber-600 font-medium mt-1">Event has been completed</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        {a?.pool_exists ? (
                          <span className="px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg flex-1">
                            Pool created
                          </span>
                        ) : a?.event?.status !== 'completed' ? (
                          <button onClick={() => openPoolModal(a)} className="px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-shadow flex-1">Create Pool</button>
                        ) : (
                          <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 rounded-lg flex-1 text-center">No pool actions</span>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              await axios.delete(`${serverURL}/organizer/applications/${a._id}`, { withCredentials: true });
                              await fetchApplications();
                              showToast("Application deleted", "success");
                            } catch (e) {
                              showToast(e?.response?.data?.message || "Failed to delete", "error");
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Application"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "rejected" && (
          <div>
            {rejectedApps.length === 0 ? (
              <p className="text-gray-600">No rejected or completed items.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {rejectedApps.map((a) => {
                  const isFromCompletedEvent = isRejectedFromCompletedEvent(a);
                  return (
                    <div key={a._id} className={`w-[30%] bg-white rounded-2xl shadow overflow-hidden mb-4 ${isFromCompletedEvent ? 'border-2 border-amber-400' : ''}`}>
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={getEventTypeImage(a?.event?.event_type)}
                          alt={a?.event?.title || "Event"}
                          className={`w-full h-full object-cover ${isFromCompletedEvent ? 'grayscale' : ''}`}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-600/30 to-pink-600/30 pointer-events-none ${isFromCompletedEvent ? 'from-amber-600/50 via-amber-600/40 to-amber-600/30' : ''}`} />
                        {isFromCompletedEvent && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold text-center">EVENT COMPLETED</div>
                          </div>
                        )}
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          {a?.host?.avatar && (
                            <img src={a.host.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{a?.event?.title || "Event"}</p>
                            <p className="text-sm text-gray-600">Status: {a.application_status}</p>
                            {isFromCompletedEvent && (
                              <p className="text-xs text-amber-600 font-semibold mt-1 bg-amber-50 p-1 rounded">
                                ⚠️ Event has been completed - No actions available
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${isFromCompletedEvent ? 'bg-amber-100 text-amber-700' : 'bg-pink-100 text-pink-700'}`}>
                            {isFromCompletedEvent ? 'Completed' : 'Rejected'}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await axios.delete(`${serverURL}/organizer/applications/${a._id}`, { withCredentials: true });
                                await fetchApplications();
                                showToast("Application deleted", "success");
                              } catch (e) {
                                showToast(e?.response?.data?.message || "Failed to delete", "error");
                              }
                            }}
                            className="p-2 rounded-lg transition-colors ml-auto text-red-600 hover:bg-red-50"
                            title="Delete Application"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {poolModal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h4 className="text-xl font-bold mb-2">Create Pool</h4>
              <p className="text-sm text-gray-600 mb-4">Event: {poolModal.app?.event?.title}</p>
              <div className="space-y-3">
                <input
                  value={poolModal.name}
                  onChange={(e) => setPoolModal((m) => ({ ...m, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Pool name"
                />
                <textarea
                  value={poolModal.description}
                  onChange={(e) => setPoolModal((m) => ({ ...m, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Pool description"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setPoolModal({ open: false, app: null, name: "", description: "" })} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={createPool} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">Create</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrganizerHostStatus;
