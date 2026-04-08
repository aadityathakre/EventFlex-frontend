import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";

function GigAttendance() {
  const { showToast } = useToast();
  const [myEvents, setMyEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [disputeEventId, setDisputeEventId] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [eventFeedbackMap, setEventFeedbackMap] = useState({});

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/gigs/my-events`, { withCredentials: true });
      setMyEvents(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${serverURL}/gigs/attendance-history`, { withCredentials: true });
      setAttendance(res.data?.data || []);
    } catch {}
  };

  const fetchMyFeedbacks = async () => {
    try {
      const res = await axios.get(`${serverURL}/gigs/feedbacks`, { withCredentials: true });
      const list = res.data?.data || [];
      const map = {};
      list.forEach((item) => {
        if (item?.event?._id && item.source === "gig" && item.kind === "gig_to_event") {
          map[String(item.event._id)] = true;
        }
      });
      setEventFeedbackMap(map);
    } catch {}
  };

  const checkIn = async (eventId) => {
    try {
      const res = await axios.post(`${serverURL}/gigs/check-in/${eventId}`, {}, { withCredentials: true });
      showToast(res.data?.message || "Checked in", "success");
      fetchMyEvents();
      fetchAttendance();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to check in", "error");
    }
  };

  const checkOut = async (eventId) => {
    try {
      const res = await axios.post(`${serverURL}/gigs/check-out/${eventId}`, {}, { withCredentials: true });
      showToast(res.data?.message || "Checked out", "success");
      fetchMyEvents();
      fetchAttendance();
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to check out", "error");
    }
  };

  const submitDispute = async () => {
    if (!disputeEventId || !disputeReason.trim()) {
      showToast("Enter a reason for dispute", "error");
      return;
    }
    try {
      const res = await axios.post(`${serverURL}/gigs/raise-dispute/${disputeEventId}`, { reason: disputeReason }, { withCredentials: true });
      showToast(res.data?.message || "Dispute raised", "success");
      setDisputeEventId(null);
      setDisputeReason("");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to raise dispute", "error");
    }
  };

  useEffect(() => { fetchMyEvents(); fetchAttendance(); fetchMyFeedbacks(); }, []);

  const classify = (ev) => {
    const now = new Date();
    const startAt = ev?.event?.start_date ? new Date(ev.event.start_date) : null;
    const endAt = ev?.event?.end_date ? new Date(ev.event.end_date) : null;
    const status = ev?.event?.status;
    const isCompleted = status === "completed" || (endAt && now > endAt);
    const isActive = status === "in_progress";
    const isUpcoming = status === "published" || (startAt && now < startAt);
    return { isUpcoming, isActive, isCompleted };
  };

  const deleteCompletedCard = async (poolId) => {
    try {
      await axios.delete(`${serverURL}/gigs/events/${poolId}`, { withCredentials: true });
      setMyEvents((prev) => prev.filter((p) => p._id !== poolId));
      showToast("Deleted from completed", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to delete", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Attendance" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Attendance</h3>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab("active")} className={`px-4 py-2 rounded-lg border ${activeTab === "active" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent" : ""}`}>Active</button>
              <button onClick={() => setActiveTab("upcoming")} className={`px-4 py-2 rounded-lg border ${activeTab === "upcoming" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent" : ""}`}>Upcoming</button>
              <button onClick={() => setActiveTab("completed")} className={`px-4 py-2 rounded-lg border ${activeTab === "completed" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent" : ""}`}>Completed</button>
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : myEvents.length === 0 ? (
            <p className="text-gray-600">No events assigned.</p>
          ) : (
            <>
              {activeTab === "active" && (
              <>
              <h4 className="text-lg font-semibold mt-2 mb-2">Active</h4>
              {myEvents.filter((ev) => classify(ev).isActive).length === 0 ? (
                <p className="text-gray-600">No active events.</p>
              ) : (
              <div className="space-y-3">
              {myEvents.filter((ev) => classify(ev).isActive).map((ev) => {
                const eventId = ev?.event?._id || ev?.event || ev?._id;
                const att = attendance.find((a) => String(a?.event?._id || a?.event) === String(eventId));
                const inProgress = !!att && !!att.check_in_time && !att.check_out_time;
                const now = new Date();
                const startAt = ev?.event?.start_date ? new Date(ev.event.start_date) : null;
                const endAt = ev?.event?.end_date ? new Date(ev.event.end_date) : null;
                const eventStarted = startAt ? now >= startAt : false;
                const eventEnded = endAt ? now > endAt : false;
                // Parse hours_worked properly
                let hours = 0;
                if (att?.hours_worked !== null && att?.hours_worked !== undefined) {
                  const hw = att.hours_worked;
                  if (typeof hw === 'number') {
                    hours = hw;
                  } else if (typeof hw === 'string') {
                    hours = parseFloat(hw) || 0;
                  } else if (typeof hw === 'object' && hw.$numberDecimal) {
                    hours = parseFloat(hw.$numberDecimal) || 0;
                  } else if (typeof hw === 'object' && typeof hw.toString === 'function') {
                    hours = parseFloat(hw.toString()) || 0;
                  }
                }
                const canReCheckIn = !!att && !!att.check_out_time && Number.isFinite(hours) && hours < (5 / 60);
                const hasFeedback = !!eventFeedbackMap[String(eventId)];
                return (
                <div key={ev._id} className="border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{ev?.event?.title || ev?.name || "Event"}</p>
                    <p className="text-sm text-gray-600">
                      Status: {eventEnded ? "Event completed" : inProgress ? "You are in event now" : att?.check_out_time ? (canReCheckIn ? "Eligible for re-check-in (<5 min)" : "Attendance complete") : "Not checked in"}
                    </p>
                    {att?.check_out_time && (
                      <p className="text-xs text-gray-600">Hours worked: {Number.isFinite(hours) ? hours.toFixed(2) : "-"}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 border rounded-md" onClick={() => setSelectedEvent(ev)}>Details</button>
                    <button
                      className={`px-3 py-2 ${
                        eventEnded || inProgress || (!canReCheckIn && !!att?.check_out_time)
                          ? "bg-gray-200 text-gray-700"
                          : "bg-emerald-600 text-white"
                      } rounded-md`}
                      onClick={() => checkIn(eventId)}
                      disabled={eventEnded || inProgress || (!eventStarted && !canReCheckIn) || (!canReCheckIn && !!att?.check_out_time)}
                      title={
                        !eventStarted && !canReCheckIn
                          ? "Event not started yet"
                          : eventEnded
                          ? "Event ended"
                          : inProgress
                          ? "Already checked in"
                          : !canReCheckIn && !!att?.check_out_time
                          ? "Attendance already completed (>=5 min)"
                          : ""
                      }
                    >
                      Check In
                    </button>
                    <button
                      className={`px-3 py-2 ${inProgress && !eventEnded ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-700"} rounded-md`}
                      onClick={() => checkOut(eventId)}
                      disabled={!inProgress || eventEnded}
                    >
                      Check Out
                    </button>
                    <button
                      className="px-3 py-2 border rounded-md"
                      onClick={() => setDisputeEventId(eventId)}
                      title="Raise dispute"
                    >
                      Raise Dispute
                    </button>
                    <button
                      className="px-3 py-2 border rounded-md"
                      onClick={() => window.location.href = "/gig/chat"}
                      title="Chat with organizer"
                    >
                      Chat
                    </button>
                    {eventEnded && (
                      <button
                        className={`px-3 py-2 rounded-md ${
                          hasFeedback ? "bg-gray-200 text-gray-700 cursor-default" : "bg-indigo-600 text-white"
                        }`}
                        onClick={() => {
                          if (!hasFeedback) {
                            setSelectedEvent({ ...ev, giveFeedback: true });
                          }
                        }}
                        disabled={hasFeedback}
                        title={hasFeedback ? "Feedback submitted" : "Give feedback"}
                      >
                        {hasFeedback ? "Feedback submitted" : "Give Feedback"}
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
                </div>
                )}
                </>
              )}
              {activeTab === "upcoming" && (
                <>
                <h4 className="text-lg font-semibold mt-6 mb-2">Upcoming</h4>
                {myEvents.filter((ev) => classify(ev).isUpcoming).length === 0 ? (
                  <p className="text-gray-600">No upcoming events.</p>
                ) : (
                <div className="space-y-3">
                {myEvents.filter((ev) => classify(ev).isUpcoming).map((ev) => (
                  <div key={ev._id} className="border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{ev?.event?.title || ev?.name || "Event"}</p>
                      <p className="text-sm text-gray-600">Status: Upcoming</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 border rounded-md" onClick={() => setSelectedEvent(ev)}>Details</button>
                      <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md" disabled>Check In</button>
                      <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md" disabled>Check Out</button>
                    </div>
                  </div>
                ))}
                </div>
                )}
                </>
              )}
              {activeTab === "completed" && (
                <>
                <h4 className="text-lg font-semibold mt-6 mb-2">Completed</h4>
                {myEvents.filter((ev) => classify(ev).isCompleted).length === 0 ? (
                  <p className="text-gray-600">No completed events.</p>
                ) : (
                <div className="space-y-3">
                {myEvents.filter((ev) => classify(ev).isCompleted).map((ev) => {
                  const eventId = ev?.event?._id || ev?.event || ev?._id;
                  const att = attendance.find((a) => String(a?.event?._id || a?.event) === String(eventId));
                  // Parse hours_worked properly
                  let hours = 0;
                  if (att?.hours_worked !== null && att?.hours_worked !== undefined) {
                    const hw = att.hours_worked;
                    if (typeof hw === 'number') {
                      hours = hw;
                    } else if (typeof hw === 'string') {
                      hours = parseFloat(hw) || 0;
                    } else if (typeof hw === 'object' && hw.$numberDecimal) {
                      hours = parseFloat(hw.$numberDecimal) || 0;
                    } else if (typeof hw === 'object' && typeof hw.toString === 'function') {
                      hours = parseFloat(hw.toString()) || 0;
                    }
                  }
                  const hasFeedback = !!eventFeedbackMap[String(eventId)];
                  return (
                    <div key={ev._id} className="border rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{ev?.event?.title || ev?.name || "Event"}</p>
                        <p className="text-sm text-gray-600">Status: Event completed</p>
                        {Number.isFinite(hours) && <p className="text-xs text-gray-600">Hours worked: {hours.toFixed(2)}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-2 border rounded-md" onClick={() => setSelectedEvent(ev)}>Details</button>
                        <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md" disabled>Check In</button>
                        <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md" disabled>Check Out</button>
                        <button
                          className={`px-3 py-2 rounded-md ${
                            hasFeedback ? "bg-gray-200 text-gray-700 cursor-default" : "bg-indigo-600 text-white"
                          }`}
                          onClick={() => {
                            if (!hasFeedback) {
                              setSelectedEvent({ ...ev, giveFeedback: true });
                            }
                          }}
                          disabled={hasFeedback}
                          title={hasFeedback ? "Feedback submitted" : "Give feedback"}
                        >
                          {hasFeedback ? "Feedback submitted" : "Give Feedback"}
                        </button>
                        <button
                          className="px-3 py-2 border rounded-md text-rose-600"
                          onClick={() => deleteCompletedCard(ev._id)}
                          title="Delete this completed card"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
                )}
                </>
              )}
            </>
          )}
        </div>

        {disputeEventId && (
          <div className="bg-white rounded-2xl shadow p-6 mt-6">
            <h4 className="font-semibold mb-2">Raise Dispute</h4>
            <label className="block text-sm text-gray-600 mb-1">Reason</label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              rows={3}
            />
            <div className="mt-4 flex gap-3">
              <button className="px-4 py-2 bg-rose-600 text-white rounded-md" onClick={submitDispute}>Submit</button>
              <button className="px-4 py-2 border rounded-md" onClick={() => { setDisputeEventId(null); setDisputeReason(""); }}>Cancel</button>
            </div>
          </div>
        )}

        {selectedEvent && !selectedEvent.giveFeedback && (
          <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 bg-black/40">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h4 className="text-lg font-semibold text-gray-900">Event Details</h4>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-3 py-1 text-sm border rounded-lg"
                >
                  Close
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <EventDetailsCard eventData={selectedEvent} onClose={() => setSelectedEvent(null)} />
              </div>
            </div>
          </div>
        )}
        {selectedEvent?.giveFeedback && (
          <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 bg-black/40">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h4 className="text-lg font-semibold text-gray-900">Give Feedback</h4>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-3 py-1 text-sm border rounded-lg"
                >
                  Close
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <FeedbackForm
                  eventId={selectedEvent?.event?._id || selectedEvent?._id}
                  onClose={() => setSelectedEvent(null)}
                  onSubmitted={(id) => {
                    const key = String(id);
                    setEventFeedbackMap((prev) => ({ ...prev, [key]: true }));
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EventDetailsCard({ eventData, onClose }) {
  const ev = eventData?.event || eventData || {};
  const title = ev?.title || ev?.name || "Event";
  const start = ev?.start_date ? new Date(ev.start_date).toLocaleString() : "-";
  const end = ev?.end_date ? new Date(ev.end_date).toLocaleString() : "-";
  const organizer = ev?.organizer;
  const organizerName = organizer?.fullName || organizer?.name || null;
  const organizerEmail = organizer?.email || null;
  const organizerLabel = organizerName || (typeof organizer === "string" ? organizer : null);
   const organizerAvatar = organizer?.profile_image_url || organizer?.avatar || null;

  return (
    <div className="bg-white rounded-2xl shadow p-6 mt-6">
      <h4 className="text-lg font-semibold mb-4">Event Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Event</p>
          <p className="text-base font-semibold text-gray-900">{title}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Organizer</p>
          <div className="flex items-center gap-3">
            {organizerAvatar ? (
              <img
                src={organizerAvatar}
                alt={organizerLabel || "Organizer"}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-100" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-gray-800 truncate">{organizerLabel || "Not available"}</p>
              {organizerEmail && <p className="text-xs text-gray-500 truncate">{organizerEmail}</p>}
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Start</p>
          <p className="text-sm text-gray-800">{start}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">End</p>
          <p className="text-sm text-gray-800">{end}</p>
        </div>
      </div>
      {eventData?.description && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{eventData.description}</p>
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <button className="px-4 py-2 border rounded-md" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => {
        const active = hovered ? star <= hovered : star <= (value || 0);
        return (
          <button
            key={star}
            type="button"
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition ${
              active
                ? "bg-yellow-400 border-yellow-400 text-white shadow-sm"
                : "bg-white border-gray-300 text-gray-400 hover:bg-yellow-50"
            }`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <span className="text-lg leading-none">★</span>
          </button>
        );
      })}
    </div>
  );
}

function FeedbackForm({ eventId, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submit = async () => {
    try {
      const res = await axios.post(`${serverURL}/gigs/feedback/${eventId}`, { rating, comment }, { withCredentials: true });
      alert(res.data?.message || "Feedback submitted");
      try {
        onSubmitted?.(eventId);
      } catch {}
      onClose?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to submit feedback");
    }
  };

  return (
    <div className="bg-slate-50 border border-dashed border-indigo-100 rounded-2xl p-5">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 mb-2">Rate your experience</p>
          <StarRating value={rating} onChange={setRating} />
          <p className="mt-2 text-xs text-gray-500">
            {rating ? `You selected ${rating} star${rating > 1 ? "s" : ""}` : "Tap a star to rate"}
          </p>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-1">Share your feedback</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm min-h-[96px] focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            rows={4}
            placeholder="Write about your experience, what went well, and what can improve."
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button className="px-4 py-2 border rounded-md" onClick={onClose}>Cancel</button>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md" onClick={submit}>Submit</button>
      </div>
    </div>
  );
}
export default GigAttendance;
