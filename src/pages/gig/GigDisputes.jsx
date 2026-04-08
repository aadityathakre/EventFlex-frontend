import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNavbar from "../../components/TopNavbar.jsx";
import { serverURL } from "../../App.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";

function GigDisputes() {
  const { showToast } = useToast();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/gigs/disputes`, { withCredentials: true });
      setDisputes(res.data?.data || []);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load disputes");
      showToast(e?.response?.data?.message || "Failed to load disputes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="My Disputes" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Disputes</h3>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : disputes.length === 0 ? (
            <p className="text-gray-600">No disputes raised.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {disputes.map((d) => {
                const event = d.event;
                const organizer = event?.organizer;
                const created = d.createdAt ? new Date(d.createdAt).toLocaleString() : "-";
                return (
                  <div key={d._id} className="bg-white rounded-xl border overflow-hidden">
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={getEventTypeImage(event?.event_type)}
                        alt={event?.title || "Event"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-indigo-600/25 to-pink-600/25 pointer-events-none" />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900">{event?.title || "Event"}</p>
                      <p className="text-xs text-gray-600">Raised: {created}</p>
                      <p className="text-sm text-gray-700 mt-2">Reason: {d.reason}</p>
                      <p className="text-xs mt-2">
                        Status: <span className="font-medium">{d.status}</span>
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        {organizer?.avatar || organizer?.profile_image_url ? (
                          <img
                            src={organizer?.profile_image_url || organizer?.avatar}
                            alt={organizer?.fullName || organizer?.name || "Organizer"}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {organizer?.fullName || organizer?.name || "Organizer"}
                          </p>
                          <p className="text-xs text-gray-600 truncate">{organizer?.email || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default GigDisputes;
