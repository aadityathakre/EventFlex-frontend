import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";

function HostEventsList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${serverURL}/host/events`, { withCredentials: true });
        setEvents(res.data?.data || []);
        setError(null);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to fetch events";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (eventId) => {
    const confirm = window.confirm("Delete this event? This action can’t be undone.");
    if (!confirm) return;
    try {
      setDeletingId(eventId);
      await axios.delete(`${serverURL}/host/events/${eventId}`, { withCredentials: true });
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete event";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Your Events</h1>
          <div className="flex gap-3">
            <button onClick={() => navigate("/host/dashboard")} className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition">Dashboard</button>
            <button onClick={() => navigate("/host/events/create")} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow">Create Event</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 mb-4">{error}</div>
        )}

        {events.length === 0 ? (
          <div className="text-center bg-white rounded-2xl shadow p-12">
            <p className="text-gray-600 mb-4">You haven't created any events yet.</p>
            <button onClick={() => navigate("/host/events/create")} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow">
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div key={ev._id} className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden">
                <div className="h-36 w-full overflow-hidden">
                  <img
                    src={getEventTypeImage(ev.event_type)}
                    alt={ev.event_type || "Event"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">{ev.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{ev.event_type?.toUpperCase()}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(ev.start_date).toLocaleString()} — {new Date(ev.end_date).toLocaleString()}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      ev.status === "published"
                        ? "bg-blue-100 text-blue-800"
                        : ev.status === "in_progress"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {ev.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 border-t">
                  <button onClick={() => navigate(`/host/events/${ev._id}`)} className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition">
                    View Event
                  </button>
                  {ev.status === "completed" && (
                    <button
                      onClick={() => handleDelete(ev._id)}
                      disabled={deletingId === ev._id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                    >
                      {deletingId === ev._id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default HostEventsList;
