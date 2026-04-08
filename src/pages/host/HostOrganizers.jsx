import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import { FaUsers, FaArrowLeft, FaPaperPlane,FaTrash, FaEnvelope } from "react-icons/fa";
import { getCardImage, getEventTypeImage } from "../../utils/imageMaps.js";

function HostOrganizers() {
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [events, setEvents] = useState([]);
  const availableEvents = events.filter((evt) => !evt.organizer);
  const [assignedPools, setAssignedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [inviteState, setInviteState] = useState({ organizerId: null, eventId: "", cover: "" });
  const [inviting, setInviting] = useState(false);
  const [details, setDetails] = useState({ open: false, data: null, loading: false, error: null });
  const personImages = [
    "image.png",
    "image2.png",
    "image3.png",
    "image copy.png",
    "image copy 2.png",
    "image copy 3.png",
    "image copy 4.png",
    "image copy 5.png",
    "image copy 6.png",
  ];

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [orgRes, evtRes, poolRes] = await Promise.all([
          axios.get(`${serverURL}/host/organizers/all`, { withCredentials: true }),
          axios.get(`${serverURL}/host/events`, { withCredentials: true }),
          axios.get(`${serverURL}/host/organizer`, { withCredentials: true }),
        ]);
        setOrganizers(orgRes.data?.data || []);
        setEvents(evtRes.data?.data || []);
        setAssignedPools(poolRes.data?.data || []);
        setError(null);
      } catch (err) {
        console.error("Organizer page load error:", err);
        setError(err.response?.data?.message || "Failed to load organizers");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const filteredOrganizers = organizers.filter((o) => {
    const text = `${o.fullName || o.name || ""} ${o.email || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const organizerAvatar = (o) => {
    // Prefer profile image URL from nested profile, then common fallbacks
    return (
      o?.profile?.profile_image_url ||
      o?.profile_image_url ||
      o?.profile?.image ||
      o?.profile?.avatar ||
      o?.user?.avatar ||
      o?.avatar ||
      o?.photo ||
      o?.image ||
      null
    );
  };

  // removed unused eventById map

  const startInvite = (organizerId) => {
    setInviteState({ organizerId, eventId: "", cover: "" });
  };

  const sendInvite = async () => {
    if (!inviteState.organizerId || !inviteState.eventId) {
      setError("Select an event to invite organizer");
      return;
    }
    const selectedEvent = events.find((e) => e._id === inviteState.eventId);
    if (selectedEvent?.organizer) {
      setError("This event already has an organizer assigned");
      return;
    }
    try {
      setInviting(true);
      const payload = { eventId: inviteState.eventId, cover_letter: inviteState.cover };
      await axios.post(`${serverURL}/host/invite-organizer/${inviteState.organizerId}`, payload, { withCredentials: true });
      setInviteState({ organizerId: null, eventId: "", cover: "" });
      // Refresh assigned pools
      const poolRes = await axios.get(`${serverURL}/host/organizer`, { withCredentials: true });
      setAssignedPools(poolRes.data?.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send invite";
      setError(msg);
    } finally {
      setInviting(false);
    }
  };

  const viewOrganizer = async (id) => {
    setDetails({ open: true, data: null, loading: true, error: null });
    try {
      const res = await axios.get(`${serverURL}/host/organizers/${id}/profile`, { withCredentials: true });
      setDetails({ open: true, data: res.data?.data, loading: false, error: null });
    } catch (e) {
      setDetails({ open: true, data: null, loading: false, error: e.response?.data?.message || "Failed to load organizer" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organizers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:text-purple-600">
                <FaArrowLeft />
              </button>
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Find Organizers
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Organizers list (≈70%) */}
          <section className="basis-[70%] grow bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">All Organizers</h3>
              <div className="flex items-center space-x-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="border rounded-lg px-3 py-2 text-sm w-64"
                />
              </div>
            </div>

            {filteredOrganizers.length === 0 ? (
              <p className="text-gray-600">No organizers found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOrganizers.map((o, idx) => {
                  const avatarUrl = organizerAvatar(o);
                  const bannerImg = `/person_images/${personImages[idx % personImages.length]}`;
                  return (
                    <div key={o._id} className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition">
                      <div className="relative h-24 overflow-hidden">
                        <img
                          src={bannerImg}
                          alt="Organizer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-purple-600/30 via-indigo-600/25 to-pink-600/25" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={o.fullName || o.name || "Organizer"} className="h-12 w-12 rounded-full object-cover border" />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center border">
                              <FaUsers className="text-purple-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{o.fullName || o.name || "Organizer"}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1"><FaEnvelope className="text-purple-500" /> {o.email}</p>
                          </div>
                        </div>

                        {/* Tags removed as requested */}

                        {inviteState.organizerId === o._id ? (
                          <div className="space-y-2 mt-4">
                            <select
                              value={inviteState.eventId}
                              onChange={(e) => setInviteState((s) => ({ ...s, eventId: e.target.value }))}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            >
                              <option value="">Select event</option>
                              {availableEvents.map((evt) => (
                                <option key={evt._id} value={evt._id}>{evt.title}</option>
                              ))}
                            </select>
                            {availableEvents.length === 0 && (
                              <p className="text-xs text-amber-600">All your events already have assigned organizers.</p>
                            )}
                            <textarea
                              value={inviteState.cover}
                              onChange={(e) => setInviteState((s) => ({ ...s, cover: e.target.value }))}
                              placeholder="Cover letter (optional)"
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={sendInvite}
                                disabled={inviting}
                                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm flex items-center space-x-2 hover:shadow"
                              >
                                <FaPaperPlane />
                                <span>{inviting ? "Sending..." : "Send Invite"}</span>
                              </button>
                              <button
                                onClick={() => setInviteState({ organizerId: null, eventId: "", cover: "" })}
                                className="px-3 py-2 border rounded-lg text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : availableEvents.length > 0 ? (
                          <button
                            onClick={() => startInvite(o._id)}
                            className="mt-4 w-full px-3 py-2 border-2 border-purple-600 text-purple-600 rounded-lg text-sm hover:bg-purple-50"
                          >
                            Invite to Event
                          </button>
                        ) : (
                          <div className="mt-4 text-xs text-gray-600">No events available for invites.</div>
                        )}
                        <button
                          onClick={() => viewOrganizer(o._id)}
                          className="mt-2 w-full px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                        >
                          View Organizer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right: Assigned Organizers sidebar (≈30%) */}
          <aside className="basis-[30%] shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaUsers className="text-purple-600" /> Assigned Organizers
              </h3>
              {assignedPools.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm">No assigned organizers yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedPools.map((p) => (
                    <div key={p._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300">
                      <div className="p-4">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                            <img
                              src={p?.event?.event_type ? getEventTypeImage(p.event.event_type) : getCardImage("cardPools")}
                              alt={p?.event?.title || "Pool"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 truncate" title={p.pool_name || p?.event?.title}>
                              {p.pool_name || p?.event?.title}
                            </h4>
                            <p className="text-xs text-purple-600 font-medium truncate mb-0.5">
                              {p?.event?.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                              <FaEnvelope size={10} /> {p?.organizer?.email}
                            </p>
                          </div>
                        </div>
                        
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => navigate(`/host/events/${p?.event?._id}`)}
                              className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-100"
                            >
                              View Event
                            </button>
                            {p?.event?.status === "completed" ? (
                              <button
                                onClick={async () => {
                                  if (!window.confirm("Remove this organizer assignment?")) return;
                                  try {
                                    await axios.delete(`${serverURL}/host/pools/${p._id}`, { withCredentials: true });
                                    const poolRes = await axios.get(`${serverURL}/host/organizer`, { withCredentials: true });
                                    setAssignedPools(poolRes.data?.data || []);
                                  } catch (e) {
                                    setError(e.response?.data?.message || "Failed to delete assignment");
                                  }
                                }}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                              >
                                <FaTrash className="mr-1.5" /> Remove
                              </button>
                            ) : (
                              <button
                                disabled
                                className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg cursor-not-allowed border border-green-100"
                              >
                                Active
                              </button>
                            )}
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      {details.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetails({ open: false, data: null, loading: false, error: null })}></div>
          <div className="relative z-10 bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h4 className="text-lg font-semibold mb-4">Organizer Details</h4>
            {details.loading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>}
            {details.error && <div className="p-2 bg-red-50 text-red-600 rounded-lg mb-3">{details.error}</div>}
            {details.data && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {details.data.user?.avatar && (
                    <img src={details.data.user.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-900">{details.data.user?.first_name} {details.data.user?.last_name}</div>
                    <div className="text-sm text-slate-600">{details.data.user?.email}</div>
                    <div className="text-sm text-slate-600">{details.data.user?.phone}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-slate-500">Aadhaar Verified</div>
                    <div className="font-semibold">{details.data.kyc?.aadhaar_verified ? "Yes" : "No"}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-slate-500">Aadhaar Number</div>
                    <div className="font-semibold">**** **** **** {details.data.kyc?.aadhaar_last4 || "--"}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setDetails({ open: false, data: null, loading: false, error: null })} className="px-4 py-2 border rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostOrganizers;
