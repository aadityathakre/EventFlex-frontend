import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";
import { FaCheckCircle } from "react-icons/fa";

function OrganizerPools() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [editPoolId, setEditPoolId] = useState("");
  const [editPoolName, setEditPoolName] = useState("");
  const [editPoolDesc, setEditPoolDesc] = useState("");
  const [ratingModal, setRatingModal] = useState({ open: false, gigId: null, eventId: null, rating: 5, review_text: "" });

  const [activeTab, setActiveTab] = useState("active");

  const fetchPools = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/organizer/pools`, { withCredentials: true });
      setPools(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to load pools", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const startEditPool = (pool) => {
    setEditPoolId(pool._id);
    setEditPoolName(pool.name || "");
    setEditPoolDesc(pool.description || "");
  };
  const cancelEditPool = () => {
    setEditPoolId("");
    setEditPoolName("");
    setEditPoolDesc("");
  };
  const saveEditPool = async () => {
    try {
      const res = await axios.put(
        `${serverURL}/organizer/pools/${editPoolId}`,
        { name: editPoolName, description: editPoolDesc },
        { withCredentials: true }
      );
      setPools((prev) => prev.map((p) => (p._id === editPoolId ? res.data?.data : p)));
      cancelEditPool();
      showToast("Pool updated", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to update pool", "error");
    }
  };

  const chatWithGig = async (gigId, eventId, poolId) => {
    try {
      const res = await axios.post(
        `${serverURL}/organizer/pools/chat/${gigId}`,
        { eventId, poolId },
        { withCredentials: true }
      );
      const convId = res.data?.data?.conversation?._id || res.data?.data?._id;
      if (convId) {
        navigate(`/organizer/chat/${convId}`);
      } else {
        showToast("Chat created but ID missing", "warning");
      }
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to start chat", "error");
    }
  };

  const deletePool = async (poolId) => {
    try {
      await axios.delete(`${serverURL}/organizer/messages/${poolId}`, { withCredentials: true });
      setPools((prev) => prev.filter((p) => p._id !== poolId));
      if (selectedPoolId === poolId) setSelectedPoolId("");
      showToast("Pool deleted", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to delete pool", "error");
    }
  };

  const openRateModal = (gigId, eventId) => {
    setRatingModal({ open: true, gigId, eventId, rating: 5, review_text: "" });
  };
  const submitRating = async () => {
    try {
      await axios.post(`${serverURL}/organizer/reviews/rating`, {
        eventId: ratingModal.eventId,
        gigId: ratingModal.gigId,
        rating: ratingModal.rating,
        review_text: ratingModal.review_text,
      }, { withCredentials: true });
      setRatingModal({ open: false, gigId: null, eventId: null, rating: 5, review_text: "" });
      showToast("Rating submitted", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to submit rating", "error");
    }
  };

  const now = new Date();
  
  const activePools = pools.filter((p) => {
    const s = p?.event?.start_date ? new Date(p.event.start_date) : null;
    const e = p?.event?.end_date ? new Date(p.event.end_date) : null;
    return p.event?.status !== 'completed' && s && e && now >= s && now <= e;
  });

  const upcomingPools = pools.filter((p) => {
    const s = p?.event?.start_date ? new Date(p.event.start_date) : null;
    return p.event?.status !== 'completed' && s && now < s;
  });

  const completedPools = pools.filter((p) => {
    const e = p?.event?.end_date ? new Date(p.event.end_date) : null;
    return p.event?.status === 'completed' || (e && now > e);
  });

  const currentPools = activeTab === "active" ? activePools : activeTab === "upcoming" ? upcomingPools : completedPools;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="My Pools" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Organizer Pools</h2>
            <button onClick={fetchPools} className="px-3 py-2 text-sm border rounded-lg">Refresh</button>
          </div>
          
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "active" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "upcoming" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "completed" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Completed
            </button>
          </div>
        </div>

        {loading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
        ) : currentPools.length === 0 ? (
          <p className="text-gray-600">No pools in {activeTab} section.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPools.map((p) => (
              <div key={p._id} className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={p?.event?.banner_url || getEventTypeImage(p?.event?.event_type)}
                    alt={p?.event?.title || "Event"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-600/30 to-pink-600/30" />
                  {activeTab === "completed" && (
                    <div className="absolute top-2 right-2">
                      <button className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg hover:bg-green-600 transition-colors flex items-center gap-1 cursor-default">
                        <FaCheckCircle /> Event has completed
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {editPoolId === p._id ? (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-900">Edit Pool</h3>
                      <input
                        value={editPoolName}
                        onChange={(e) => setEditPoolName(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-full"
                        placeholder="Pool name"
                      />
                      <textarea
                        value={editPoolDesc}
                        onChange={(e) => setEditPoolDesc(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-full"
                        placeholder="Description"
                        rows={3}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={cancelEditPool} className="px-3 py-2 text-sm border rounded-lg">Cancel</button>
                        <button onClick={saveEditPool} className="px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                      <p className="text-sm text-gray-600">Event: {p?.event?.title || "-"}</p>
                      <p className="text-sm text-gray-600">Gigs joined: {p?.gigs?.length || 0}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEditPool(p)} className="px-3 py-2 text-sm border rounded-lg">Edit</button>
                          {activeTab === "completed" && (
                            <button onClick={() => deletePool(p._id)} className="px-3 py-2 text-sm border rounded-lg text-rose-600">Delete</button>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedPoolId(selectedPoolId === p._id ? "" : p._id)}
                          className="px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg"
                        >
                          Show Gigs
                        </button>
                      </div>
                    </>
                  )}
                  {selectedPoolId === p._id && (
                    <div className="mt-3 space-y-2">
                      {(p.gigs || []).length === 0 ? (
                        <p className="text-gray-600">No gigs in this pool.</p>
                      ) : (
                        p.gigs.map((g) => (
                          <div key={g._id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <img src={g.avatar} alt={g.fullName} className="w-8 h-8 rounded-full object-cover" />
                              <span className="text-sm font-medium">{g.fullName || `${g.first_name} ${g.last_name}`}</span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => chatWithGig(g._id, p?.event?._id, p._id)} className="px-3 py-1 text-xs border rounded-lg">Chat</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {ratingModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setRatingModal({ open: false, gigId: null, eventId: null, rating: 5, review_text: "" })}></div>
            <div className="relative z-10 bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
              <h4 className="text-lg font-semibold mb-4">Rate Gig</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rating (1-5)</label>
                  <input type="number" min={1} max={5} value={ratingModal.rating} onChange={(e) => setRatingModal((m) => ({ ...m, rating: parseInt(e.target.value, 10) }))} className="border rounded-lg px-3 py-2 w-full" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Review</label>
                  <textarea value={ratingModal.review_text} onChange={(e) => setRatingModal((m) => ({ ...m, review_text: e.target.value }))} rows={3} className="border rounded-lg px-3 py-2 w-full" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={() => setRatingModal({ open: false, gigId: null, eventId: null, rating: 5, review_text: "" })} className="px-3 py-2 text-sm border rounded-lg">Cancel</button>
                <button onClick={submitRating} className="px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">Submit</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default OrganizerPools;
