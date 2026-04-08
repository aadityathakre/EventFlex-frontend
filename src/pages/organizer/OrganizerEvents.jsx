import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";
import { FaTrash } from "react-icons/fa";

function OrganizerEvents() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [applications, setApplications] = useState([]);
  const [deletedEventIds, setDeletedEventIds] = useState(new Set());

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/organizer/events/all`, {
        withCredentials: true,
      });
      setEvents((res.data?.data || []).sort((a, b) => b._id - a._id ));
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // fetch my applications to filter and disable appropriately
    (async () => {
      try {
        const res = await axios.get(`${serverURL}/organizer/applications`, {
          withCredentials: true,
        });
        setApplications(res.data?.data || []);
      } catch (e) {
        console.warn("Failed to load applications", e);
      }
    })();
    try {
      const raw = localStorage.getItem("org_deleted_event_ids");
      if (raw) {
        const arr = JSON.parse(raw);
        setDeletedEventIds(new Set(Array.isArray(arr) ? arr : []));
      }
    } catch (e) {
      console.warn("Failed to read deleted ids", e);
    }
  }, []);

  const loadEventDetails = async (eventId) => {
    try {
      const res = await axios.get(`${serverURL}/organizer/events/${eventId}`, {
        withCredentials: true,
      });
      setDetails(res.data?.data);
    } catch {
      setDetails(null);
      showToast("Failed to load event details", "error");
    }
  };

  const requestEvent = async (event) => {
    try {
      await axios.post(
        `${serverURL}/organizer/events/request-host/${event._id}`,
        {
          eventId: event._id,
          cover_letter: "Interested to organize this event.",
        },
        { withCredentials: true }
      );
      // throttle re-request for 5 minutes
      try {
        const key = `org_event_request_ts_${event._id}`;
        localStorage.setItem(key, Date.now().toString());
      } catch (e) {
        console.warn("LocalStorage write failed", e);
      }
      showToast("Request sent to host successfully", "success");
      // also refresh applications to reflect pending state
      try {
        const res = await axios.get(`${serverURL}/organizer/applications`, {
          withCredentials: true,
        });
        setApplications(res.data?.data || []);
      } catch (e) {
        console.warn("Failed to refresh applications", e);
      }
    } catch (e) {
      showToast(
        e?.response?.data?.message || "Failed to send request",
        "error"
      );
    }
  };

  // derive event filters and button disabled state
  const appByEvent = useMemo(() => {
    const map = new Map();
    applications.forEach((a) => {
      if (a?.event?._id) map.set(a.event._id, a);
    });
    return map;
  }, [applications]);

  const visibleEvents = useMemo(() => {
    return events.filter((e) => !deletedEventIds.has(e._id));
  }, [events, deletedEventIds]);

  const isRequestDisabled = (eventId) => {
    const app = appByEvent.get(eventId);
    if (app && app.application_status === "pending") return true; // already requested
    if (app && app.application_status === "accepted") return true; // invitation accepted
    // throttle by local storage for 5 minutes
    try {
      const key = `org_event_request_ts_${eventId}`;
      const ts = parseInt(localStorage.getItem(key) || "0", 10);
      if (!ts) return false;
      const fiveMin = 5 * 60 * 1000;
      return Date.now() - ts < fiveMin;
    } catch {
      return false;
    }
  };

  const isHostRequested = (eventId) => {
    const app = appByEvent.get(eventId);
    if (!app) return false;
    return (
      app.sender &&
      app.organizer &&
      String(app.sender) !== String(app.organizer)
    );
  };
  const deleteEventCard = (eventId) => {
    setDeletedEventIds((prev) => {
      const next = new Set(Array.from(prev));
      next.add(eventId);
      try {
        localStorage.setItem(
          "org_deleted_event_ids",
          JSON.stringify(Array.from(next))
        );
      } catch (e) {
        console.warn("Failed to persist deleted ids", e);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Explore Events" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Active Events
            </h2>
            <button
              onClick={fetchEvents}
              className="px-3 py-2 text-sm border rounded-lg"
            >
              Refresh
            </button>
          </div>
          {loading && (
            <div className="mt-4 animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          )}
          {error && <p className="text-red-600 mt-3">{error}</p>}
        </div>

        {visibleEvents.length === 0 && !loading ? (
          <p className="text-gray-600">No events found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleEvents.map((e) => (
              <div
                key={e._id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={e.banner_url || getEventTypeImage(e.event_type)}
                    alt={e.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-600/30 to-pink-600/30"></div>
                </div>
                <div className="p-5 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900">{e.title}</h3>
                  <p className="text-sm text-gray-600 h-16 overflow-y-auto">
                    {e.description?.slice(0, 120) || "Event"}
                  </p>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <button
                      onClick={() => loadEventDetails(e._id)}
                      className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      Details
                    </button>

                    {isHostRequested(e._id) &&
                    appByEvent.get(e._id)?.application_status === "pending" ? (
                      <button
                        onClick={() => navigate("/organizer/host-status")}
                        className="px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow"
                      >
                        Requested by Host
                      </button>
                    ) : isHostRequested(e._id) &&
                      appByEvent.get(e._id)?.application_status ===
                        "accepted" ? (
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          disabled
                          className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg cursor-not-allowed"
                        >
                          Requested by Host
                        </button>
                        <button
                          onClick={() => deleteEventCard(e._id)}
                          className="  rounded-full text-red-500 hover:text-red-400  ml-4 shadow "
                          title="Delete card"
                        >
                          <FaTrash size={20} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => requestEvent(e)}
                        disabled={isRequestDisabled(e._id)}
                        className={`px-3 py-2 text-sm rounded-lg hover:shadow ${
                          isRequestDisabled(e._id)
                            ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                        }`}
                      >
                        {isRequestDisabled(e._id)
                          ? "Requested to Host"
                          : "Request to Organize"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {details && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
              <div className="relative h-56">
                <img
                  src={
                    details.banner_url || getEventTypeImage(details.event_type)
                  }
                  alt={details.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-black/20" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h4 className="text-2xl font-extrabold drop-shadow">
                    {details?.title}
                  </h4>
                  <p className="text-sm opacity-90">
                    {details?.location?.city ||
                      details?.location?.address ||
                      "-"}
                  </p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    {details?.description}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                      Start:{" "}
                      {details?.start_date
                        ? new Date(details.start_date).toLocaleDateString(
                            "en-GB"
                          )
                        : "-"}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                      End:{" "}
                      {details?.end_date
                        ? new Date(details.end_date).toLocaleDateString("en-GB")
                        : "-"}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Budget: ₹{" "}
                      {(() => {
                        const raw = details?.budget;
                        const num =
                          typeof raw === "object" && raw?.$numberDecimal
                            ? parseFloat(raw.$numberDecimal)
                            : parseFloat(raw ?? 0);
                        return Number.isFinite(num) ? num.toFixed(2) : "0.00";
                      })()}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Organizer</p>
                    <p className="font-semibold text-gray-900">
                      {details?.organizer?.name || "-"}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Host</p>
                    <p className="font-semibold text-gray-900">
                      {details?.host?.name || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {details?.host?.email || "-"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end">
                <button
                  onClick={() => setDetails(null)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrganizerEvents;
