import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNavbar from "../../components/TopNavbar.jsx";
import { serverURL } from "../../App.jsx";
import { useToast } from "../../context/ToastContext.jsx";

function GigFeedbacks() {
  const { showToast } = useToast();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/gigs/feedbacks`, { withCredentials: true });
      setFeedbacks(res.data?.data || []);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load feedbacks");
      showToast(e?.response?.data?.message || "Failed to load feedbacks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const renderSourceLabel = (item) => {
    if (item?.source === "organizer") return "Feedback from organizer";
    if (item?.source === "gig") return "Your feedback";
    return "Feedback";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Feedback & Ratings" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">My Feedbacks</h3>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : feedbacks.filter((f) => f.source === "organizer").length === 0 ? (
            <p className="text-gray-600">No feedback yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedbacks.filter((f) => f.source === "organizer").map((f) => {
                const createdAt = f?.createdAt ? new Date(f.createdAt) : null;
                const dateLabel = createdAt ? createdAt.toLocaleString() : "-";
                const ratingValue = typeof f.rating === "number" ? f.rating : Number(f.rating || 0);
                const organizer = f.organizer;
                return (
                  <div
                    key={f._id}
                    className="relative bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          {organizer?.avatar || organizer?.profile_image_url ? (
                            <img
                              src={organizer?.profile_image_url || organizer?.avatar}
                              alt={organizer?.fullName || organizer?.name || "Organizer"}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {organizer?.fullName || organizer?.name || "Organizer"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {organizer?.email || "-"}
                            </p>
                          </div>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-900 truncate">
                          {f?.event?.title || "Event"}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {f?.event?.start_date
                            ? new Date(f.event.start_date).toLocaleDateString()
                            : "-"}{" "}
                          —{" "}
                          {f?.event?.end_date
                            ? new Date(f.event.end_date).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <StarRow value={ratingValue} />
                          <span className="text-xs font-medium text-gray-700">
                            {ratingValue ? ratingValue.toFixed(1).replace(/\.0$/, "") : "-"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">{dateLabel}</span>
                      </div>
                    </div>
                    {f.comment && (
                      <p className="mt-3 text-sm text-gray-700 line-clamp-4 whitespace-pre-line">
                        {f.comment}
                      </p>
                    )}
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

function StarRow({ value }) {
  const stars = [1, 2, 3, 4, 5];
  const numeric = typeof value === "number" ? value : Number(value || 0);

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => {
        const active = numeric >= star - 0.5;
        return (
          <span
            key={star}
            className={`text-xs ${
              active ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

export default GigFeedbacks;
