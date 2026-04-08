import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import TopNavbar from "../../components/TopNavbar.jsx";
import { serverURL } from "../../App.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";

function GigMyEvents() {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // active | upcoming | completed
  const [ratingModal, setRatingModal] = useState({ open: false, eventId: null, organizerId: null, rating: 5, review_text: "" });
  const [disputeModal, setDisputeModal] = useState({ open: false, eventId: null, reason: "" });
  const [eventRatingMap, setEventRatingMap] = useState({});

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/gigs/my-events`, { withCredentials: true });
      setEvents(res.data?.data || []);
      setError(null);
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to load events";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await axios.get(`${serverURL}/gigs/feedbacks`, { withCredentials: true });
        const list = res.data?.data || [];
        const map = {};
        list.forEach((item) => {
          if (item?.event?._id && item.source === "gig" && item.kind === "gig_to_organizer") {
            map[String(item.event._id)] = true;
          }
        });
        setEventRatingMap(map);
      } catch {}
    };
    fetchFeedbacks();
  }, []);

  const now = new Date();
  const grouped = useMemo(() => {
    const upcoming = [];
    const active = [];
    const completed = [];
    for (const p of events) {
      const s = p?.event?.start_date ? new Date(p.event.start_date) : null;
      const e = p?.event?.end_date ? new Date(p.event.end_date) : null;
      const status = p?.event?.status;
      
      // Check if event is marked as completed by host
      if (status === "completed") {
        completed.push(p);
      }
      // Check if event has ended based on end_date
      else if (e && now > e) {
        completed.push(p);
      }
      // Check if event hasn't started yet
      else if (s && now < s) {
        upcoming.push(p);
      }
      // Event is currently active
      else if (s && e && now >= s && now <= e) {
        active.push(p);
      }
    }
    return { upcoming, active, completed };
  }, [events]);

  const openRate = (pool) => {
    const ev = pool?.event;
    if (!ev?.organizer) {
      showToast("Organizer not assigned for this event", "error");
      return;
    }
    setRatingModal({
      open: true,
      eventId: ev._id || pool?.event?._id,
      organizerId: ev.organizer,
      rating: 5,
      review_text: "",
    });
  };

  const submitRating = async () => {
    try {
      await axios.post(`${serverURL}/gigs/reviews/rating`, {
        eventId: ratingModal.eventId,
        organizerId: ratingModal.organizerId,
        rating: ratingModal.rating,
        review_text: ratingModal.review_text,
      }, { withCredentials: true });
      setEventRatingMap((prev) => ({ ...prev, [String(ratingModal.eventId)]: true }));
      setRatingModal({ open: false, eventId: null, organizerId: null, rating: 5, review_text: "" });
      showToast("Rating submitted", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to submit rating", "error");
    }
  };

  const submitDispute = async () => {
    if (!disputeModal.eventId || !disputeModal.reason.trim()) {
      showToast("Enter a reason for dispute", "error");
      return;
    }
    try {
      const res = await axios.post(`${serverURL}/gigs/raise-dispute/${disputeModal.eventId}`, { reason: disputeModal.reason }, { withCredentials: true });
      showToast(res.data?.message || "Dispute raised", "success");
      setDisputeModal({ open: false, eventId: null, reason: "" });
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to raise dispute", "error");
    }
  };

  const removeLocal = (poolId) => {
    setEvents((prev) => prev.filter((p) => p._id !== poolId));
  };

  const Section = ({ title, items, showRate, showAttendance }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <button className="px-3 py-2 text-sm border rounded-lg" onClick={fetchEvents}>Refresh</button>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-600">No events in this section.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => {
            const eventId = p?.event?._id;
            const rated = !!eventRatingMap[String(eventId)];
            return (
            <div key={p._id} className="group relative bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition flex flex-col">
              <div className="h-36 w-full overflow-hidden">
                <img
                  src={p?.event?.banner_url || getEventTypeImage(p?.event?.event_type)}
                  alt={p?.event?.title || "Event"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-sm text-gray-600">{p?.event?.title || "-"}</p>
                <p className="text-xs text-gray-500">
                  {p?.event?.start_date ? new Date(p.event.start_date).toLocaleString() : "-"} — {p?.event?.end_date ? new Date(p.event.end_date).toLocaleString() : "-"}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button className="w-full px-3 py-2 text-sm border rounded-lg" onClick={() => window.location.href = "/gig/chat"}>Chat</button>
                  <button className="w-full px-3 py-2 text-sm border rounded-lg" onClick={() => setDisputeModal({ open: true, eventId: p?.event?._id, reason: "" })}>Dispute</button>
                  {showAttendance ? (
                    <button className="w-full px-3 py-2 text-sm border rounded-lg" onClick={() => window.location.href = "/gig/attendance"}>Attendance</button>
                  ) : (
                    <button className="w-full px-3 py-2 text-sm border bg-emerald-500 text-white rounded-lg line-through" disabled>Completed</button>
                  )}
                </div>
                {showRate && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (!rated) openRate(p);
                      }}
                      disabled={rated}
                      className={`w-full px-3 py-2 text-sm rounded-lg ${
                        rated ? "bg-gray-200 text-gray-700 cursor-default" : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      }`}
                    >
                      {rated ? "Feedback submitted" : "Rate Organizer ⭐"}
                    </button>
                    <button onClick={() => removeLocal(p._id)} className="w-full px-3 py-2 text-sm border rounded-lg text-rose-600">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="My Events" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex flex-wrap items-center gap-3">
          <button onClick={() => setActiveTab("active")} className={`px-4 py-2 rounded-lg border ${activeTab === "active" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent" : ""}`}>Active</button>
          <button onClick={() => setActiveTab("upcoming")} className={`px-4 py-2 rounded-lg border ${activeTab === "upcoming" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent" : ""}`}>Upcoming</button>
          <button onClick={() => setActiveTab("completed")} className={`px-4 py-2 rounded-lg border ${activeTab === "completed" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent" : ""}`}>Completed</button>
        </div>

        {loading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />}
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 mb-4">{error}</div>}

        {activeTab === "active" && <Section title="Active Events" items={grouped.active} showRate={false} showAttendance={true} />}
        {activeTab === "upcoming" && <Section title="Upcoming Events" items={grouped.upcoming} showRate={false} showAttendance={false} />}
        {activeTab === "completed" && <Section title="Completed Events" items={grouped.completed} showRate={true} showAttendance={false} />}

        {ratingModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setRatingModal({ open: false, eventId: null, organizerId: null, rating: 5, review_text: "" })}></div>
            <div className="relative z-10 bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
              <h4 className="text-lg font-semibold mb-4">Rate Organizer</h4>
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
                <button onClick={() => setRatingModal({ open: false, eventId: null, organizerId: null, rating: 5, review_text: "" })} className="px-3 py-2 text-sm border rounded-lg">Cancel</button>
                <button onClick={submitRating} className="px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">Submit</button>
              </div>
            </div>
          </div>
        )}
        {disputeModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setDisputeModal({ open: false, eventId: null, reason: "" })}></div>
            <div className="relative z-10 bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
              <h4 className="text-lg font-semibold mb-4">Raise Dispute</h4>
              <label className="block text-sm text-gray-600 mb-1">Reason</label>
              <textarea value={disputeModal.reason} onChange={(e) => setDisputeModal((m) => ({ ...m, reason: e.target.value }))} rows={3} className="border rounded-lg px-3 py-2 w-full" />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={() => setDisputeModal({ open: false, eventId: null, reason: "" })} className="px-3 py-2 text-sm border rounded-lg">Cancel</button>
                <button onClick={submitDispute} className="px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">Submit</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default GigMyEvents;
