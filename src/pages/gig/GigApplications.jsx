import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNavbar from "../../components/TopNavbar.jsx";
import { serverURL } from "../../App.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";
import { FaComments, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Section({ title, items, navigate, onDelete, onRequestAgain, disableMap }) {


  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-gray-600">No any application fount</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((app) => {
            const event = app.event || app?.pool?.event || null;
            const organizer = app.organizer;
            const start = event?.start_date ? new Date(event.start_date).toLocaleString() : "-";
            const end = event?.end_date ? new Date(event.end_date).toLocaleString() : "-";
            return (
              <div key={app._id} className="bg-white rounded-xl border overflow-hidden">
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={getEventTypeImage(event?.event_type)}
                    alt={event?.title || "Event"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-indigo-600/25 to-pink-600/25 pointer-events-none" />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900">{event?.title || app?.pool?.pool_name || "Event details not available"}</p>
                  <p className="text-xs text-gray-600">Start: {start}</p>
                  <p className="text-xs text-gray-600">End: {end}</p>
                  <div className="mt-2 flex items-center gap-2">
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
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-600">Applied: {new Date(app.createdAt).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                        onClick={() => navigate("/gig/chat")}
                        title="Chat with organizer"
                      >
                        <FaComments className="text-purple-600" />
                      </button>
                      <button
                        className="px-3 py-2 border rounded-lg text-sm text-rose-600 hover:bg-rose-50"
                        onClick={() => onDelete?.(app)}
                        title="Delete application"
                      >
                        <FaTrash />
                      </button>
                      {title === "Rejected" && (
                        <button
                          className="px-3 py-2 border rounded-lg text-sm bg-indigo-600 text-white disabled:bg-gray-300 disabled:text-gray-600"
                          onClick={() => onRequestAgain?.(app)}
                          disabled={!!disableMap?.[app._id]}
                          title="Request again"
                        >
                          {disableMap?.[app._id] ? "Requested" : "Request Again"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GigApplications({ navigate }) {
  const { showToast } = useToast();
  const [sections, setSections] = useState({ requested: [], accepted: [], rejected: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("requested"); // requested | accepted | rejected
  const [disableMap, setDisableMap] = useState({});
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/gigs/applications`, { withCredentials: true });
      setSections(res.data?.data || { requested: [], accepted: [], rejected: [] });
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load applications");
      showToast(e?.response?.data?.message || "Failed to load applications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deleteApplication = async (app) => {
    try {
      await axios.delete(`${serverURL}/gigs/applications/${app._id}`, { withCredentials: true });
      setSections((prev) => ({
        requested: prev.requested.filter((x) => x._id !== app._id),
        accepted: prev.accepted.filter((x) => x._id !== app._id),
        rejected: prev.rejected.filter((x) => x._id !== app._id),
      }));
      showToast("Application deleted", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to delete application", "error");
    }
  };

  const requestAgain = async (app) => {
    try {
      const poolId = app?.pool?._id || app?.pool;
      if (!poolId) {
        showToast("Pool not found for application", "error");
        return;
      }
      await axios.post(`${serverURL}/gigs/join-pool/${poolId}`, { proposed_rate: 0, cover_message: "Requesting again" }, { withCredentials: true });
      setDisableMap((m) => ({ ...m, [app._id]: true }));
      showToast("Requested again", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to request again", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Application Status" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-wrap items-center gap-3">
              <button onClick={() => setActiveTab("requested")} className={`px-4 py-2 rounded-lg border ${activeTab === "requested" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent" : ""}`}>Requested</button>
              <button onClick={() => setActiveTab("accepted")} className={`px-4 py-2 rounded-lg border ${activeTab === "accepted" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent" : ""}`}>Accepted</button>
              <button onClick={() => setActiveTab("rejected")} className={`px-4 py-2 rounded-lg border ${activeTab === "rejected" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent" : ""}`}>Rejected</button>
              <button className="ml-auto px-3 py-2 text-sm border rounded-lg" onClick={load}>Refresh</button>
            </div>
            {activeTab === "requested" && <Section title="Requested" items={sections.requested} navigate={nav} onDelete={deleteApplication} disableMap={disableMap} />}
            {activeTab === "accepted" && <Section title="Accepted" items={sections.accepted} navigate={nav} onDelete={deleteApplication} disableMap={disableMap} />}
            {activeTab === "rejected" && <Section title="Rejected" items={sections.rejected} navigate={nav} onDelete={deleteApplication} onRequestAgain={requestAgain} disableMap={disableMap} />}
          </>
        )}
      </main>
    </div>
  );
}

export default GigApplications;
