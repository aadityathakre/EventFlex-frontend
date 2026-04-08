import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";
import { FaCheckCircle, FaStar, FaTrash } from "react-icons/fa";

function OrganizerManageGigs() {
  const { showToast } = useToast();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedPoolId, setExpandedPoolId] = useState("");
  const [chatModal, setChatModal] = useState({ open: false, convId: null, gig: null, pool: null, eventId: null });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [gigProfileModal, setGigProfileModal] = useState({ open: false, data: null });
  const [attendanceModal, setAttendanceModal] = useState({ open: false, eventId: null, eventTitle: "", attendanceData: [] });
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  
  // Tabs state
  const [activeTab, setActiveTab] = useState("active"); // active, upcoming, completed

  // Rating Modal State
  const [ratingModal, setRatingModal] = useState({ open: false, gigId: null, eventId: null, gigName: "" });
  const [ratingData, setRatingData] = useState({ rating: 5, review_text: "" });
  const [ratedGigs, setRatedGigs] = useState(new Set());

  // Local-only clear chat support (per conversation)
  const clearKey = (convId) => `org_chat_cleared_ts_${convId}`;
  const getClearTs = (convId) => {
    try {
      const v = localStorage.getItem(clearKey(convId));
      return v ? new Date(v).getTime() : 0;
    } catch {
      return 0;
    }
  };
  const filterByClearTs = (convId, msgs) => {
    const ts = getClearTs(convId);
    if (!ts) return msgs;
    return msgs.filter((m) => {
      const t = new Date(m.createdAt || m.timestamp || m.sentAt || Date.now()).getTime();
      return t >= ts;
    });
  };
  const clearChatLocally = () => {
    if (!chatModal.convId) return;
    try {
      localStorage.setItem(clearKey(chatModal.convId), new Date().toISOString());
    } catch (e) { void e; }
    setChatMessages([]);
    showToast("Chat cleared locally", "success");
  };

  const fetchPools = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/organizer/pools`, { withCredentials: true });
      setPools(res.data?.data || []);
    } catch (e) {
      console.warn("Pools load failed", e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGivenRatings = async () => {
    try {
      const res = await axios.get(`${serverURL}/organizer/reviews/given`, { withCredentials: true });
      const given = res.data?.data || [];
      const set = new Set();
      given.forEach((r) => {
        if (r.event && r.reviewee) {
          set.add(`${r.event}-${r.reviewee}`);
        }
      });
      setRatedGigs(set);
    } catch (e) {
      console.warn("Failed to fetch given ratings", e);
    }
  };

  useEffect(() => {
    fetchPools();
    fetchGivenRatings();
  }, []);

  const removeGig = async (poolId, gigId) => {
    const ok = typeof window !== "undefined" ? window.confirm("Are you sure you want to remove this gig from the pool?") : true;
    if (!ok) return;
    try {
      await axios.delete(`${serverURL}/organizer/pools/${poolId}/gigs/${gigId}`, { withCredentials: true });
      showToast("Gig removed from pool", "success");
      await fetchPools();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to remove gig", "error");
    }
  };

  const viewGigProfile = async (gigId) => {
    try {
      const res = await axios.get(`${serverURL}/organizer/gigs/${gigId}/profile`, { withCredentials: true });
      const payload = res.data?.data || null;
      const merged = payload ? { ...(payload.mergedProfile || {}), kyc: payload.kyc || null } : null;
      setGigProfileModal({ open: true, data: merged });
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load gig profile", "error");
    }
  };

  const deletePool = async (poolId) => {
    const ok = typeof window !== "undefined" ? window.confirm("Delete this completed pool?") : true;
    if (!ok) return;
    try {
      await axios.delete(`${serverURL}/organizer/pools/${poolId}`, { withCredentials: true });
      setPools((prev) => prev.filter((p) => p._id !== poolId));
      if (expandedPoolId === poolId) setExpandedPoolId("");
      showToast("Pool deleted", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to delete pool", "error");
    }
  };

  const openChat = async (gig, eventId, poolId) => {
    setChatLoading(true);
    try {
      const res = await axios.post(
        `${serverURL}/organizer/pools/chat/${gig._id}`,
        { eventId, poolId },
        { withCredentials: true }
      );
      const conv = res.data?.data?.conversation || res.data?.conversation || res.data?.data;
      const conversationId = conv?._id;
      if (!conversationId) throw new Error("Conversation not created");
      
      // Load messages
      const msgRes = await axios.get(`${serverURL}/organizer/messages/${conversationId}`, { withCredentials: true });
      const msgs = msgRes.data?.data || [];
      setChatMessages(filterByClearTs(conversationId, msgs));
      
      setChatModal({ open: true, convId: conversationId, gig, pool: poolId, eventId });
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to open chat", "error");
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatModal.convId || !chatInput.trim()) return;
    try {
      const res = await axios.post(
        `${serverURL}/organizer/message/${chatModal.convId}`,
        { message_text: chatInput.trim() },
        { withCredentials: true }
      );
      const msg = res.data?.data || res.data;
      // Ensure sender is formatted for UI
      const uiMsg = { ...msg, sender: { role: 'organizer', _id: msg.sender } };
      setChatMessages((m) => [...m, uiMsg]);
      setChatInput("");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to send", "error");
    }
  };

  const openRatingModal = (gig, eventId) => {
    setRatingModal({ open: true, gigId: gig._id, eventId, gigName: gig.fullName || `${gig.first_name} ${gig.last_name}` });
    setRatingData({ rating: 5, review_text: "" });
  };

  const submitRating = async () => {
    if (!ratingModal.gigId || !ratingModal.eventId) return;
    try {
      await axios.post(`${serverURL}/organizer/reviews/rating`, {
        eventId: ratingModal.eventId,
        gigId: ratingModal.gigId,
        rating: ratingData.rating,
        review_text: ratingData.review_text
      }, { withCredentials: true });
      setRatedGigs((prev) => new Set(prev).add(`${ratingModal.eventId}-${ratingModal.gigId}`));
      showToast("Rating submitted successfully", "success");
      setRatingModal({ open: false, gigId: null, eventId: null, gigName: "" });
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to submit rating", "error");
    }
  };

  const viewAttendance = async (eventId, eventTitle) => {
    setLoadingAttendance(true);
    setAttendanceModal({ open: true, eventId, eventTitle, attendanceData: [] });
    try {
      const res = await axios.get(`${serverURL}/organizer/events/${eventId}/live-tracking`, { withCredentials: true });
      const data = res.data?.data || [];
      setAttendanceModal({ open: true, eventId, eventTitle, attendanceData: data });
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load attendance", "error");
      setAttendanceModal({ open: false, eventId: null, eventTitle: "", attendanceData: [] });
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Filter pools based on activeTab
  const filteredPools = pools.filter((p) => {
    const event = p.event;
    if (!event) return false;
    
    const now = new Date();
    const startDate = new Date(event.start_date);
    const status = event.status || "upcoming";

    if (activeTab === "completed") {
      return status === "completed";
    } else if (activeTab === "active") {
      // Active if status is NOT completed AND (status is active OR startDate <= now)
      return status !== "completed" && (status === "active" || startDate <= now);
    } else if (activeTab === "upcoming") {
      // Upcoming if status is NOT completed AND startDate > now AND status is NOT active
      return status !== "completed" && status !== "active" && startDate > now;
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Manage Gigs" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header & Refresh */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Pools & Teams</h2>
          
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {["active", "upcoming", "completed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <button onClick={fetchPools} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">Refresh</button>
        </div>

        {/* Pools Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500">No {activeTab} pools found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPools.map((p) => (
              <div key={p._id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow">
                
                {/* Card Image Header */}
                <div className="relative h-40">
                  <img
                    src={getEventTypeImage(p?.event?.event_type)}
                    alt={p?.event?.title || "Event"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-white font-bold text-lg truncate">{p.name}</h3>
                    <p className="text-white/90 text-sm truncate">{p?.event?.title}</p>
                  </div>
                  
                  {/* Status Badge for Completed */}
                  {activeTab === "completed" && (
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <FaCheckCircle /> Event has been completed
                      </div>
                      <button
                        onClick={() => deletePool(p._id)}
                        className="p-2 rounded-full bg-white/80 backdrop-blur border border-rose-200 text-rose-600 hover:bg-rose-50"
                        aria-label="Delete pool"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">
                      {p.gigs?.length || 0} Members
                    </span>
                    <div className="flex items-center gap-2">
                      {(activeTab === "active" || activeTab === "completed") && (
                        <button
                          onClick={() => viewAttendance(p?.event?._id, p?.event?.title)}
                          className="px-3 py-1 text-xs bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Attendance
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedPoolId(expandedPoolId === p._id ? "" : p._id)}
                        className="text-sm text-purple-600 font-semibold hover:text-purple-700"
                      >
                        {expandedPoolId === p._id ? "Hide Gigs" : "Manage Gigs"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Gigs List */}
                  {expandedPoolId === p._id && (
                    <div className="mt-2 space-y-3 border-t pt-3">
                      {(p.gigs || []).length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No gigs joined yet.</p>
                      ) : (
                        p.gigs.map((g) => (
                          <div key={g._id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <img src={g.avatar} alt={g.fullName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-800">{g.fullName || `${g.first_name} ${g.last_name}`}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => viewGigProfile(g._id)} className="px-2 py-1 text-xs border bg-white rounded hover:bg-gray-100">Profile</button>
                              <button onClick={() => openChat(g, p?.event?._id, p._id)} className="px-2 py-1 text-xs border bg-white rounded hover:bg-gray-100">Chat</button>
                              {activeTab !== "completed" && (
                                <button 
                                  onClick={() => removeGig(p._id, g._id)}
                                  className="px-2 py-1 text-xs border border-red-200 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                >
                                  Remove
                                </button>
                              )}
                              {activeTab === "completed" && (
                                ratedGigs.has(`${p?.event?._id}-${g._id}`) ? (
                                  <button disabled className="px-2 py-1 text-xs bg-gray-100 text-gray-500 font-bold rounded cursor-not-allowed border border-gray-200">
                                    Rating Submitted
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => openRatingModal(g, p?.event?._id)} 
                                    className="px-2 py-1 text-xs bg-yellow-400 text-white font-bold rounded hover:bg-yellow-500 flex items-center gap-1"
                                  >
                                    <FaStar className="w-3 h-3" /> Rate
                                  </button>
                                )
                              )}
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

        {/* Chat Modal */}
        {chatModal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col h-[600px]">
              <div className="p-4 border-b flex items-center justify-between bg-gray-50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img src={chatModal.gig?.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{chatModal.gig?.fullName || "Gig"}</h4>
                    <p className="text-xs text-gray-500">Event Chat</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={clearChatLocally} className="text-xs text-red-500 hover:underline">Clear</button>
                  <button onClick={() => setChatModal({ open: false, convId: null, gig: null, pool: null, eventId: null })} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {chatLoading ? (
                  <div className="flex justify-center pt-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" /></div>
                ) : chatMessages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm mt-10">Start the conversation!</p>
                ) : (
                  chatMessages.map((m) => {
                    const isOrganizer = m.sender?.role === 'organizer' || m.sender === 'organizer'; // simplified check
                    const time = new Date(m.createdAt || m.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    return (
                      <div key={m._id} className={`flex ${isOrganizer ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                          isOrganizer 
                            ? 'bg-purple-600 text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 shadow-sm rounded-tl-none'
                        }`}>
                          <p>{m.message_text}</p>
                          <p className={`text-[10px] mt-1 text-right ${isOrganizer ? 'text-purple-200' : 'text-gray-400'}`}>{time}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t bg-white rounded-b-2xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                  />
                  <button onClick={sendMessage} className="bg-purple-600 text-white px-5 py-2 rounded-full hover:bg-purple-700 font-medium">Send</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {ratingModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Rate {ratingModal.gigName}</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingData({ ...ratingData, rating: star })}
                      className={`text-2xl transition-colors ${
                        star <= ratingData.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <textarea
                  rows="4"
                  value={ratingData.review_text}
                  onChange={(e) => setRatingData({ ...ratingData, review_text: e.target.value })}
                  placeholder="Share your experience working with this gig..."
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRatingModal({ open: false, gigId: null, eventId: null, gigName: "" })}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Submit Rating
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Modal */}
        {attendanceModal.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600">
                <div>
                  <h2 className="text-2xl font-bold text-white">Attendance Tracking</h2>
                  <p className="text-indigo-100 text-sm mt-1">{attendanceModal.eventTitle}</p>
                </div>
                <button
                  onClick={() => setAttendanceModal({ open: false, eventId: null, eventTitle: "", attendanceData: [] })}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                {loadingAttendance ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : attendanceModal.attendanceData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg font-medium">No attendance records yet</p>
                    <p className="text-sm mt-1">Gigs will appear here once they check in</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attendanceModal.attendanceData.map((record) => {
                      const gigName = record.gig?.fullName || `${record.gig?.first_name || ''} ${record.gig?.last_name || ''}`.trim() || 'Unknown';
                      const hasCheckedOut = !!record.check_out_time;
                      const checkInTime = record.check_in_time ? new Date(record.check_in_time).toLocaleString() : 'N/A';
                      const checkOutTime = record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out';
                      
                      // Parse hours_worked - handle Decimal128, number, string, or object
                      let hoursWorked = 'N/A';
                      if (record.hours_worked !== null && record.hours_worked !== undefined) {
                        const hw = record.hours_worked;
                        if (typeof hw === 'number') {
                          hoursWorked = hw.toFixed(2);
                        } else if (typeof hw === 'string') {
                          hoursWorked = parseFloat(hw).toFixed(2);
                        } else if (typeof hw === 'object' && hw.$numberDecimal) {
                          hoursWorked = parseFloat(hw.$numberDecimal).toFixed(2);
                        } else if (typeof hw === 'object' && typeof hw.toString === 'function') {
                          hoursWorked = parseFloat(hw.toString()).toFixed(2);
                        } else {
                          hoursWorked = Number(hw).toFixed(2);
                        }
                      }
                      
                      return (
                        <div key={record._id} className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${hasCheckedOut ? 'border-green-500' : 'border-yellow-500'}`}>
                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <img 
                                src={record.gig?.avatar || "https://via.placeholder.com/50"} 
                                alt={gigName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{gigName}</h3>
                                <p className="text-sm text-gray-500 truncate">{record.gig?.email || 'No email'}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                hasCheckedOut 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {hasCheckedOut ? 'Completed' : 'Active'}
                              </span>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Check-In Time</p>
                                <p className="text-sm font-medium text-gray-900">{checkInTime}</p>
                              </div>
                              
                              {hasCheckedOut && (
                                <>
                                  <div className="bg-purple-50 p-3 rounded-lg">
                                    <p className="text-xs text-purple-600 font-semibold uppercase mb-1">Check-Out Time</p>
                                    <p className="text-sm font-medium text-gray-900">{checkOutTime}</p>
                                  </div>
                                  
                                  <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-xs text-green-600 font-semibold uppercase mb-1">Total Hours Worked</p>
                                    <p className="text-lg font-bold text-green-700">{hoursWorked} hrs</p>
                                  </div>
                                </>
                              )}
                              
                              {!hasCheckedOut && (
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                  <p className="text-xs text-yellow-600 font-semibold uppercase mb-1">Status</p>
                                  <p className="text-sm font-medium text-gray-900">Currently working...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gig Profile Modal */}
        {gigProfileModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0" onClick={() => setGigProfileModal({ open: false, data: null })}></div>
            <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-24"></div>
              <div className="px-6 pb-6 relative">
                <div className="-mt-12 mb-4">
                  <img 
                    src={gigProfileModal.data?.profile_image_url || "https://via.placeholder.com/100"} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md bg-white"
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900">
                  {gigProfileModal.data?.name || ""}
                </h3>
                <p className="text-gray-500 mb-2">{gigProfileModal.data?.email || ""}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 font-medium">KYC Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      gigProfileModal.data?.kyc?.status === "approved"
                        ? "bg-green-100 text-green-700" 
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {gigProfileModal.data?.kyc?.status || "Pending"}
                    </span>
                  </div>
                  
                  {gigProfileModal.data?.bio ? (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Bio</p>
                      <p className="text-sm text-gray-700">{gigProfileModal.data.bio}</p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500 uppercase">Events</p>
                        <p className="font-bold text-lg">{gigProfileModal.data?.events_count || 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500 uppercase">Rating</p>
                        <p className="font-bold text-lg flex items-center justify-center gap-1">
                            {gigProfileModal.data?.rating ? Number(gigProfileModal.data.rating).toFixed(1) : "N/A"} <FaStar className="text-yellow-400 text-xs"/>
                        </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={() => setGigProfileModal({ open: false, data: null })}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default OrganizerManageGigs;
  
