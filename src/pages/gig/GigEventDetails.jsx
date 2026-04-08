import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import TopNavbar from "../../components/TopNavbar.jsx";
import { serverURL } from "../../App.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";

function GigEventDetails() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${serverURL}/gigs/my-events`, { withCredentials: true });
        const items = res.data?.data || [];
        const found = items.find((p) => String(p._id) === String(poolId)) || null;
        setPool(found);
        setError(found ? null : "Event not found");
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load event details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [poolId]);

  const event = pool?.event || null;
  const start = event?.start_date ? new Date(event.start_date).toLocaleString() : "-";
  const end = event?.end_date ? new Date(event.end_date).toLocaleString() : "-";
  const eventImage = event?.banner_url || getEventTypeImage(event?.event_type);
  const organizer = event?.organizer;
  const organizerName = organizer?.fullName || organizer?.name || null;
  const organizerEmail = organizer?.email || null;
  const organizerAvatar = organizer?.profile_image_url || organizer?.avatar || null;
  const status = event?.status || (end && new Date() > new Date(end) ? "completed" : null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Event Details" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button className="px-3 py-2 text-sm border rounded-lg" onClick={() => navigate("/gig/dashboard")}>
            Back to Dashboard
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-600">Loading event...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="rounded-xl overflow-hidden border">
                  <img src={eventImage} alt={event?.title || "Event"} className="w-full h-40 object-cover" />
                </div>
                {status && (
                  <span className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                    {status === "in_progress" ? "Active" : status === "published" ? "Upcoming" : "Completed"}
                  </span>
                )}
              </div>
              <div className="md:col-span-2 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Event</p>
                  <p className="text-base font-semibold text-gray-900">{event?.title || pool?.pool_name || "Assigned Event"}</p>
                  <p className="text-xs text-gray-500">Type: {event?.event_type || "-"}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Start</p>
                    <p className="text-sm text-gray-800">{start}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">End</p>
                    <p className="text-sm text-gray-800">{end}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Organizer</p>
                  <div className="flex items-center gap-3">
                    {organizerAvatar ? (
                      <img
                        src={organizerAvatar}
                        alt={organizerName || "Organizer"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{organizerName || "Not available"}</p>
                      {organizerEmail && <p className="text-xs text-gray-600 truncate">{organizerEmail}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default GigEventDetails;
