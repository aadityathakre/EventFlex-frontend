import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";

function OrganizerPoolApplications() {
  const { showToast } = useToast();
  const [pools, setPools] = useState([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPools = async () => {
    setLoadingPools(true);
    try {
      const res = await axios.get(`${serverURL}/organizer/pools`, { withCredentials: true });
      setPools(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to load pools", "error");
    } finally {
      setLoadingPools(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPoolApps = async (poolId) => {
    if (!poolId) return;
    setLoadingApps(true);
    try {
      const res = await axios.get(`${serverURL}/organizer/pools/${poolId}/applications`, { withCredentials: true });
      setApps(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to load applications", "error");
    } finally {
      setLoadingApps(false);
    }
  };

  const reviewPoolApp = async (app, action) => {
    try {
      // Infer organizer pool by event for reliable capacity check
      const pool = pools.find((p) => p._id === selectedPoolId);
      const eventId = pool?.event?._id;
      let orgPoolId = null;
      if (eventId) {
        const orgPoolRes = await axios
          .get(`${serverURL}/organizer/org-pools/by-event/${eventId}`, { withCredentials: true })
          .catch(() => null);
        orgPoolId = orgPoolRes?.data?.data?._id || null;
      }

      await axios.post(
        `${serverURL}/organizer/applications/${app._id}/review`,
        { action, orgPoolId },
        { withCredentials: true }
      );
      // Optimistically remove application from UI for faster feedback
      setApps((prev) => prev.filter((x) => x._id !== app._id));
      showToast(action === "approve" ? "Gig approved and added to pool" : "Gig application rejected", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to review application", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Pool Applications" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedPoolId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedPoolId(id);
                fetchPoolApps(id);
              }}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select a pool</option>
              {pools.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p?.event?.title || "Event"})
                </option>
              ))}
            </select>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search applicants by name"
              className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px]"
            />
            <button className="px-3 py-2 text-sm border rounded-lg" onClick={() => fetchPoolApps(selectedPoolId)}>
              Refresh
            </button>
          </div>
          {(loadingPools || loadingApps) && (
            <div className="mt-3 animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
          )}
        </div>

        {selectedPoolId && apps.length === 0 ? (
          <p className="text-gray-600">No applications for this pool.</p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {apps
              .filter((a) => {
                const name = a?.gig?.fullName || `${a?.gig?.first_name || ""} ${a?.gig?.last_name || ""}`;
                return name.toLowerCase().includes(searchTerm.toLowerCase());
              })
              .map((a) => (
              <div key={a._id} className="group relative bg-white rounded-2xl overflow-hidden shadow-lg w-[30%]">
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={getEventTypeImage(pools.find((p) => p._id === a.pool)?.event?.event_type)}
                    alt={(pools.find((p) => p._id === a.pool)?.event?.title) || "Event"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-600/30 to-pink-600/30" />
                </div>
                <div className="p-5">
                  <div className="mb-2">
                    <p className="text-xs text-gray-600">Pool: {pools.find((p) => p._id === a.pool)?.name || '-'}</p>
                    <p className="text-xs text-gray-600">Event: {pools.find((p) => p._id === a.pool)?.event?.title || '-'}</p>
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div>
                      <p className="font-semibold">{a?.gig?.fullName || `${a?.gig?.first_name} ${a?.gig?.last_name}`}</p>
                      <p className="text-sm text-gray-600">Proposed: ₹ {(a?.proposed_rate?.$numberDecimal || a?.proposed_rate)?.toString?.() || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={() => reviewPoolApp(a, "reject")} className="px-3 py-2 text-sm border rounded-lg">Reject</button>
                    <button onClick={() => reviewPoolApp(a, "approve")} className="px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">Accept</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default OrganizerPoolApplications;