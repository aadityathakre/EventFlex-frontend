import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";

function HostEventDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const state = location.state;
    if (state?.toast) {
      setToast(state.toast);
      setTimeout(() => setToast(null), 3000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${serverURL}/host/events/${id}`, { withCredentials: true });
        setEvent(res.data?.data);
        setError(null);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to fetch event details";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!event) return;
    const confirm = window.confirm("Delete this event? This action can’t be undone.");
    if (!confirm) return;
    try {
      setDeleting(true);
      await axios.delete(`${serverURL}/host/events/${id}`, { withCredentials: true });
      navigate("/host/events", {
        state: { toast: { type: "success", message: "Event deleted successfully" } },
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete event";
      setToast({ type: "error", message: msg });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate("/host/events")} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const coords = event?.location?.coordinates || [];
  const budgetValue = (() => {
    if (typeof event?.budget === "object" && event?.budget?.$numberDecimal) {
      return parseFloat(event.budget.$numberDecimal);
    }
    const b = event?.budget?.toString?.() || event?.budget || 0;
    const n = parseFloat(b);
    return isNaN(n) ? 0 : n;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Event Details</h1>
          <div className="flex gap-3">
            <button onClick={() => navigate("/host/events")} className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition">All Events</button>
            {event?.status !== "completed" && (
              <button onClick={() => navigate(`/host/events/${id}/edit`)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow">Edit Event</button>
            )}
            {event?.status === "completed" && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toast && (
          <div className={`mb-4 p-3 rounded-lg border ${toast.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            {toast.message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="h-44 w-full overflow-hidden">
            <img
              src={getEventTypeImage(event.event_type)}
              alt={event.event_type || "Event"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <h2 className="text-white text-2xl font-bold">{event.title}</h2>
            <p className="text-white/80">{event.event_type?.toUpperCase()}</p>
          </div>
          <div className="p-6 space-y-4">
            {event.description && (
              <div>
                <h3 className="text-gray-900 font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{event.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-gray-900 font-semibold mb-2">Schedule</h3>
                <p className="text-gray-700">Start: {new Date(event.start_date).toLocaleString()}</p>
                <p className="text-gray-700">End: {new Date(event.end_date).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-2">Location</h3>
                <p className="text-gray-700">Longitude: {coords[0]}</p>
                <p className="text-gray-700">Latitude: {coords[1]}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-gray-900 font-semibold mb-2">Budget</h3>
                <p className="text-gray-700">₹ {budgetValue.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-2">Status</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  event.status === "published"
                    ? "bg-blue-100 text-blue-800"
                    : event.status === "in_progress"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {event.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              {event?.status !== "completed" && (
                <button onClick={() => navigate(`/host/events/${id}/edit`)} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow">
                  Edit Event
                </button>
              )}
              {event?.status === "completed" && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HostEventDetail;