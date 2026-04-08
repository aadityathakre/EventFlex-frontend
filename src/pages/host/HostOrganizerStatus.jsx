import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTrash } from "react-icons/fa";
import { getEventTypeImage } from "../../utils/imageMaps.js";

const isEventCompleted = (event) => {
  if (!event) return false;
  // Check status field first
  if (event.status === 'completed') return true;
  // Fallback: check if event end date has passed
  if (event.event_end_date) {
    return new Date(event.event_end_date) < new Date();
  }
  return false;
};

function HostOrganizerStatus() {
  const navigate = useNavigate();
  const [appsSummary, setAppsSummary] = useState({ invited: [], requested: [], accepted: [], rejected: [] });
  const [assignedPools, setAssignedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("invited"); // invited | requested | accepted | rejected
  const [poolForm, setPoolForm] = useState({ open: false, organizerId: "", eventId: "", pool_name: "", max_capacity: 10, required_skills: "", pay_min: "", pay_max: "", lat: "", lng: "" });
  const [orgDetails, setOrgDetails] = useState({ open: false, data: null, loading: false, error: null });

  const fetchAll = async () => {
    try {
      const [appsRes, poolsRes] = await Promise.all([
        axios.get(`${serverURL}/host/organizers/invites`, { withCredentials: true }),
        axios.get(`${serverURL}/host/organizer`, { withCredentials: true }),
      ]);
      setAppsSummary(appsRes.data?.data || { invited: [], requested: [], accepted: [], rejected: [] });
      setAssignedPools(poolsRes.data?.data || []);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load organizer status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const hasPoolForEvent = useMemo(() => {
    const map = new Map();
    assignedPools.forEach((p) => {
      if (p?.event?._id) map.set(p.event._id, p);
    });
    return (eventId) => map.get(eventId);
  }, [assignedPools]);

  // Track completed event IDs for rejected applications
  const completedEventIds = useMemo(() => {
    const ids = new Set();
    (appsSummary.invited || []).forEach((a) => {
      if (isEventCompleted(a.event)) {
        ids.add(a.event?._id);
      }
    });
    (appsSummary.requested || []).forEach((a) => {
      if (isEventCompleted(a.event)) {
        ids.add(a.event?._id);
      }
    });
    return ids;
  }, [appsSummary.invited, appsSummary.requested]);

  const invitedApps = useMemo(() => {
    const filtered = (appsSummary.invited || []).filter(a => !isEventCompleted(a.event));
    return [...filtered].reverse();
  }, [appsSummary.invited]);

  const requestedApps = useMemo(() => {
    const filtered = (appsSummary.requested || []).filter(a => !isEventCompleted(a.event));
    return [...filtered].reverse();
  }, [appsSummary.requested]);

  const acceptedApps = useMemo(() => [...(appsSummary.accepted || [])].reverse(), [appsSummary.accepted]);

  const rejectedApps = useMemo(() => {
    // Combine originally rejected apps with invited and requested apps from completed events
    const rejected = appsSummary.rejected || [];
    const completedInvited = (appsSummary.invited || []).filter(a => isEventCompleted(a.event));
    const completedRequested = (appsSummary.requested || []).filter(a => isEventCompleted(a.event));
    return [...rejected, ...completedInvited, ...completedRequested].reverse();
  }, [appsSummary.rejected, appsSummary.invited, appsSummary.requested]);

  const approveApplication = async (appId) => {
    try {
      await axios.post(`${serverURL}/host/approve-organizer/${appId}`, {}, { withCredentials: true });
      await fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to approve organizer");
    }
  };

  const rejectApplication = async (appId) => {
    try {
      await axios.post(`${serverURL}/host/reject-organizer/${appId}`, {}, { withCredentials: true });
      await fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to reject organizer");
    }
  };

  const openPoolForm = (organizerId, eventId) => {
    setPoolForm((f) => ({ ...f, open: true, organizerId, eventId }));
  };

  const resendInvite = async (organizerId, eventId) => {
    try {
      await axios.post(`${serverURL}/host/invite-organizer/${organizerId}`, { eventId, cover_letter: "" }, { withCredentials: true });
      await fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to resend invitation");
    }
  };

  const openOrganizerDetails = async (organizerId) => {
    setOrgDetails({ open: true, data: null, loading: true, error: null });
    try {
      const res = await axios.get(`${serverURL}/host/organizers/${organizerId}/profile`, { withCredentials: true });
      setOrgDetails({ open: true, data: res.data?.data, loading: false, error: null });
    } catch (e) {
      setOrgDetails({ open: true, data: null, loading: false, error: e.response?.data?.message || "Failed to load organizer" });
    }
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
      await fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create organizer pool");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organizer status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold flex items-center gap-2">
                <span>&larr;</span> Back
            </button>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Organizer Status</h1>
            <div className="w-16"></div>
          </div>
          <div className="max-w-3xl mx-auto mb-6">
            <div className="relative flex p-1 space-x-1 bg-slate-100 rounded-xl shadow-inner">
                {/* Sliding background pill */}
                <div 
                    className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out"
                    style={{
                        left: `${['invited', 'requested', 'accepted', 'rejected'].indexOf(activeTab) * 25}%`,
                        width: '24.5%',
                        marginLeft: '0.25%'
                    }}
                />
                
                {['invited', 'requested', 'accepted', 'rejected'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-lg capitalize transition-colors duration-200 ${
                            activeTab === tab
                            ? 'text-purple-700'
                            : 'text-slate-500 hover:text-purple-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4">{error}</div>}

        {activeTab === "invited" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {invitedApps.length === 0 ? (
              <p className="text-gray-600 col-span-full text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">No pending invitations.</p>
            ) : (
              invitedApps.map((app) => {
                const pool = hasPoolForEvent(app?.event?._id);
                const statusClass = app.application_status === 'accepted'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : app.application_status === 'rejected'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200';
                return (
                  <div key={app._id} className="group rounded-2xl bg-white border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                    {app?.event?.event_type && (
                      <div className="relative h-32 w-full overflow-hidden">
                        <img 
                            src={getEventTypeImage(app.event.event_type)} 
                            alt={app.event.event_type} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            loading="lazy" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                        <div className="absolute top-3 right-3">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm backdrop-blur-md ${statusClass}`}>
                                 {app.application_status}
                             </span>
                        </div>
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-slate-900 mb-1 truncate" title={app?.event?.title}>{app?.event?.title || "Event"}</h3>
                      <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                          Organizer: <span className="font-medium text-slate-700">{app?.applicant?.email || "Unknown"}</span>
                      </p>

                      {app.application_status === 'pending' && (
                        <div className="mt-auto bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
                            <p className="text-xs font-medium text-amber-800">Invitation sent</p>
                            <p className="text-[10px] text-amber-600">Awaiting organizer response</p>
                        </div>
                      )}
                      
                      {app.application_status === 'accepted' && (
                        <div className="mt-auto space-y-2 pt-4 border-t border-slate-100">
                          {app?.organizer_pool_exists ? (
                            <div className="w-full px-3 py-2 text-sm text-center rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-100 flex items-center justify-center gap-2">
                                <FaCheckCircle /> Pool Active
                            </div>
                          ) : (
                            <button onClick={() => openPoolForm(app.applicant?._id, app.event?._id)} className="w-full px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                                Create Organizer Pool
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if(!window.confirm("Are you sure you want to remove this application?")) return;
                              try {
                                await axios.delete(`${serverURL}/host/organizers/applications/${app._id}`, { withCredentials: true });
                                await fetchAll();
                              } catch (e) {
                                setError(e.response?.data?.message || "Failed to delete");
                              }
                            }}
                            className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "requested" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {requestedApps.length === 0 ? (
              <p className="text-gray-600">No requests yet.</p>
            ) : (
              requestedApps.map((app) => {
                const statusClass = app.application_status === 'accepted'
                  ? 'bg-green-100 text-green-700'
                  : app.application_status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700';
                return (
                  <div key={app._id} className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
                    {app?.event?.event_type && (
                      <div className="relative h-40 w-full overflow-hidden">
                        <img src={getEventTypeImage(app.event.event_type)} alt={app.event.event_type} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-purple-600/30 via-indigo-600/25 to-pink-600/25" />
                      </div>
                    )}
                    <div className="p-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {app?.applicant?.avatar && (
                          <img src={app.applicant.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{app?.event?.title || "Event"}</p>
                          <p className="text-sm text-slate-600">Organizer: {app?.applicant?.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusClass}`}>{app.application_status}</span>
                    </div>
                    {app.application_status === 'pending' && (
                      <div className="px-4 pb-4 flex items-center gap-2">
                        <button onClick={() => approveApplication(app._id)} className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg">Accept</button>
                        <button onClick={() => rejectApplication(app._id)} className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg">Reject</button>
                      </div>
                    )}
                    {app.application_status === 'accepted' && (
                      <div className="px-4 pb-4">
                        {app?.organizer_pool_exists ? (
                          <button disabled className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-600">Organizer pool created</button>
                        ) : (
                          <button onClick={() => openPoolForm(app.applicant?._id, app.event?._id)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Create Organizer Pool</button>
                        )}
                        <button onClick={() => openOrganizerDetails(app.applicant?._id)} className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">View Organizer</button>
                        <button
                          onClick={async () => {
                            try {
                              await axios.delete(`${serverURL}/host/organizers/applications/${app._id}`, { withCredentials: true });
                              await fetchAll();
                            } catch (e) {
                              setError(e.response?.data?.message || "Failed to delete");
                            }
                          }}
                          className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "accepted" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedApps.length === 0 ? (
              <p className="text-gray-600">No accepted items yet.</p>
            ) : (
              acceptedApps.map((app) => {
                const statusClass = 'bg-green-100 text-green-700';
                return (
                  <div key={app._id} className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
                    {app?.event?.event_type && (
                      <div className="relative h-40 w-full overflow-hidden">
                        <img src={getEventTypeImage(app.event.event_type)} alt={app.event.event_type} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-purple-600/30 via-indigo-600/25 to-pink-600/25" />
                      </div>
                    )}
                    <div className="p-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {app?.applicant?.avatar && (
                          <img src={app.applicant.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                        )}
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{app?.event?.title || "Event"}</p>
                          <p className="text-sm text-slate-600">Organizer: {app?.applicant?.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusClass}`}>{app.application_status}</span>
                    </div>
                    <div className="px-4 pb-4">
                      {app?.organizer_pool_exists ? (
                        <button disabled className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-600">Organizer pool created</button>
                      ) : (
                        <button onClick={() => openPoolForm(app.applicant?._id, app.event?._id)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Create Organizer Pool</button>
                      )}
                      <button onClick={() => openOrganizerDetails(app.applicant?._id)} className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">View Organizer</button>
                      <button
                        onClick={async () => {
                          try {
                            await axios.delete(`${serverURL}/host/organizers/applications/${app._id}`, { withCredentials: true });
                            await fetchAll();
                          } catch (e) {
                            setError(e.response?.data?.message || "Failed to delete");
                          }
                        }}
                        className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "rejected" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rejectedApps.length === 0 ? (
              <p className="text-gray-600">No rejected items.</p>
            ) : (
              rejectedApps.map((app) => (
                <div key={app._id} className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
                  {app?.event?.event_type && (
                    <div className="relative h-40 w-full overflow-hidden">
                      <img src={getEventTypeImage(app.event.event_type)} alt={app.event.event_type} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-purple-600/30 via-indigo-600/25 to-pink-600/25" />
                    </div>
                  )}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {app?.applicant?.avatar && (
                        <img src={app.applicant.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{app?.event?.title || "Event"}</p>
                        <p className="text-sm text-slate-600">Organizer: {app?.applicant?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 capitalize">{app.application_status}</span>
                      <button
                        onClick={async () => {
                          if(!window.confirm("Are you sure you want to delete this application?")) return;
                          try {
                            await axios.delete(`${serverURL}/host/organizers/applications/${app._id}`, { withCredentials: true });
                            await fetchAll();
                          } catch (e) {
                            setError(e.response?.data?.message || "Failed to delete");
                          }
                        }}
                        title="Delete application"
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <button onClick={() => openOrganizerDetails(app.applicant?._id)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">View Organizer</button>
                    <button
                      onClick={() => resendInvite(app.applicant?._id, app.event?._id)}
                      disabled={completedEventIds.has(app.event?._id)}
                      title={completedEventIds.has(app.event?._id) ? "Cannot invite again - Event is completed" : "Resend invitation"}
                      className={`mt-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                        completedEventIds.has(app.event?._id)
                          ? 'border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'border border-purple-300 text-purple-700 hover:bg-purple-50'
                      }`}
                    >
                      {completedEventIds.has(app.event?._id) ? '✓ Event Completed' : 'Invite Again'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {poolForm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPoolForm((f) => ({ ...f, open: false }))}></div>
          <div className="relative z-10 bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h4 className="text-lg font-semibold mb-4">Create Organizer Pool</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={poolForm.pool_name} onChange={(e) => setPoolForm((f) => ({ ...f, pool_name: e.target.value }))} placeholder="Pool name" className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" min="1" value={poolForm.max_capacity} onChange={(e) => setPoolForm((f) => ({ ...f, max_capacity: e.target.value }))} placeholder="Max capacity" className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input value={poolForm.required_skills} onChange={(e) => setPoolForm((f) => ({ ...f, required_skills: e.target.value }))} placeholder="Required skills (comma-separated)" className="border rounded-lg px-3 py-2 text-sm w-full mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="number" value={poolForm.pay_min} onChange={(e) => setPoolForm((f) => ({ ...f, pay_min: e.target.value }))} placeholder="Pay min (₹)" className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={poolForm.pay_max} onChange={(e) => setPoolForm((f) => ({ ...f, pay_max: e.target.value }))} placeholder="Pay max (₹)" className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
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
      {orgDetails.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
                <h3 className="text-xl font-bold text-white">Organizer Details</h3>
            </div>
            
            <div className="p-6">
                {orgDetails.loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : orgDetails.error ? (
                    <div className="text-center py-8">
                        <p className="text-red-600 mb-2">{orgDetails.error}</p>
                        <p className="text-sm text-gray-500">Could not load details.</p>
                    </div>
                ) : orgDetails.data ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      {orgDetails.data.user?.avatar ? (
                        <img src={orgDetails.data.user.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-purple-100" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl font-bold">
                            {orgDetails.data.user?.first_name?.[0] || 'O'}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xl text-gray-900">{orgDetails.data.user?.first_name} {orgDetails.data.user?.last_name}</div>
                        <div className="text-gray-600">{orgDetails.data.user?.email}</div>
                        {orgDetails.data.user?.phone && <div className="text-sm text-gray-500">{orgDetails.data.user?.phone}</div>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">KYC Verified</div>
                        <div className={`font-bold ${orgDetails.data.kyc?.aadhaar_verified ? 'text-green-600' : 'text-amber-600'}`}>
                            {orgDetails.data.kyc?.aadhaar_verified ? "Yes" : "Pending"}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Experience</div>
                        <div className="font-bold text-gray-900">{orgDetails.data.profile?.experience_years || 0} Years</div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                         <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Aadhaar Status</div>
                         <div className="flex items-center gap-2">
                             <div className="font-medium text-gray-900">
                                 {orgDetails.data.kyc?.aadhaar_last4 ? `**** **** **** ${orgDetails.data.kyc?.aadhaar_last4}` : "Not provided"}
                             </div>
                             {orgDetails.data.kyc?.aadhaar_verified && <FaCheckCircle className="text-green-500" />}
                         </div>
                    </div>
                  </div>
                ) : null}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button 
                onClick={() => setOrgDetails({ open: false, data: null, loading: false, error: null })} 
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostOrganizerStatus;
