import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";

function GigPools() {
  const { showToast } = useToast();
  const [nearby, setNearby] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [rate, setRate] = useState(0);
  const [cover, setCover] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appliedPoolIds, setAppliedPoolIds] = useState(new Set());
  const [joinedPoolIds, setJoinedPoolIds] = useState(new Set());
  const [poolFlags, setPoolFlags] = useState({}); // orgPoolId -> { isGigInPool, appliedStatus, poolId }

  const fetchNearby = async () => {
    setLoading(true);
    try {
     
      const res = await axios.get(`${serverURL}/gigs/nearby-events`, {
        withCredentials: true,
      
      });
      const data = res.data?.data || [];
      const now = new Date();
      const filtered = (Array.isArray(data) ? data : []).filter((p) => {
        const e = p?.event?.end_date ? new Date(p.event.end_date) : null;
        return e && now <= e;
      });
      setNearby(filtered);
      if (filtered.length > 0) {
        const results = await Promise.all(
          filtered.map((p) =>
            axios
              .get(`${serverURL}/gigs/organizer-pool/${p._id}`, { withCredentials: true })
              .then((r) => ({ orgPoolId: p._id, data: r.data?.data }))
              .catch(() => ({ orgPoolId: p._id, data: null }))
          )
        );
        const nextFlags = {};
        const nextApplied = new Set(appliedPoolIds);
        const nextJoined = new Set(joinedPoolIds);
        for (const r of results) {
          const d = r.data;
          if (d?.flags) {
            nextFlags[r.orgPoolId] = {
              isGigInPool: !!d.flags.isGigInPool,
              appliedStatus: d.flags.appliedStatus || "none",
              poolId: d?.pool?._id,
            };
            if (d.flags.appliedStatus && d.flags.appliedStatus !== "none" && d?.pool?._id) {
              nextApplied.add(d.pool._id);
            }
            if (d.flags.isGigInPool && d?.pool?._id) {
              nextJoined.add(d.pool._id);
            }
          }
        }
        setPoolFlags(nextFlags);
        setAppliedPoolIds(nextApplied);
        setJoinedPoolIds(nextJoined);
      }
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to fetch nearby pools", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (poolId) => {
    try {
      const res = await axios.get(`${serverURL}/gigs/organizer-pool/${poolId}`, { withCredentials: true });
      const d = res.data?.data || null;
      setDetails(d);
      if (d?.flags?.appliedStatus && d?.flags?.appliedStatus !== "none") {
        setAppliedPoolIds((prev) => new Set([...prev, d?.pool?._id].filter(Boolean)));
      }
      if (d?.flags?.isGigInPool) {
        setJoinedPoolIds((prev) => new Set([...prev, d?.pool?._id].filter(Boolean)));
      }
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to fetch pool details", "error");
    }
  };

  const join = async (poolId) => {
    try {
      const res = await axios.post(
        `${serverURL}/gigs/join-pool/${poolId}`,
        { proposed_rate: rate || 0, cover_message: cover },
        { withCredentials: true }
      );
      showToast(res.data?.message || "Applied to pool", "success");
      setAppliedPoolIds((prev) => new Set([...prev, poolId]));
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to apply", "error");
    }
  };

  useEffect(() => { fetchNearby(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Join Organizer Pools" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-xl font-bold mb-4">Nearby Events</h3>
          {loading ? (
            <p>Loading...</p>
          ) : nearby.length === 0 ? (
            <p className="text-gray-600">No pools found nearby.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nearby.map((orgPool) => (
                <div key={orgPool._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={getEventTypeImage(orgPool?.event?.event_type)}
                      alt={orgPool?.event?.title || "Event"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-indigo-600/25 to-pink-600/25 pointer-events-none" />
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{orgPool?.event?.title || orgPool?.pool_name || "Organizer Pool"}</p>
                      <p className="text-sm text-gray-600">Capacity: {orgPool?.max_capacity ?? "-"}</p>
                      <p className="text-xs text-gray-500">Status: {orgPool?.status || "open"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                        onClick={() => { setSelected(orgPool._id); setShowJoinForm(false); fetchDetails(orgPool._id); }}
                      >
                        View More
                      </button>
                      <button
                        className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm"
                        onClick={() => { setSelected(orgPool._id); setShowJoinForm(true); fetchDetails(orgPool._id); }}
                        disabled={
                          (poolFlags[orgPool._id]?.isGigInPool) ||
                          ((poolFlags[orgPool._id]?.appliedStatus || "none") !== "none")
                        }
                        title={
                          poolFlags[orgPool._id]?.isGigInPool
                            ? "You are in pool"
                            : (poolFlags[orgPool._id]?.appliedStatus || "none") !== "none"
                            ? "Request sent"
                            : "Join"
                        }
                      >
                        {poolFlags[orgPool._id]?.isGigInPool
                          ? "You are in pool"
                          : (poolFlags[orgPool._id]?.appliedStatus || "none") !== "none"
                          ? "Requested"
                          : "Join"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="bg-white rounded-2xl shadow p-6 mt-6">
            <h4 className="font-semibold mb-3">Event & Organizer Details</h4>
            {!details ? (
              <p className="text-sm text-gray-500 mb-3">Loading pool details...</p>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  {details?.pool?.organizer?.avatar || details?.pool?.organizer?.profile_image_url ? (
                    <img
                      src={details?.pool?.organizer?.profile_image_url || details?.pool?.organizer?.avatar}
                      alt="Organizer"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {details?.pool?.organizer?.fullName || details?.pool?.organizer?.name || "Organizer"}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{details?.pool?.organizer?.email || "-"}</p>
                    <p className="text-xs text-gray-600">KYC: {details?.pool?.organizer?.kycVideo?.status || "unknown"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-xl p-4">
                    <p className="text-sm font-semibold mb-1">Event</p>
                    <p className="text-sm text-gray-700">{details?.orgPool?.event?.title || "Event"}</p>
                    <p className="text-xs text-gray-600">Start: {details?.orgPool?.event?.start_date ? new Date(details.orgPool.event.start_date).toLocaleString() : "-"}</p>
                    <p className="text-xs text-gray-600">End: {details?.orgPool?.event?.end_date ? new Date(details.orgPool.event.end_date).toLocaleString() : "-"}</p>
                    <p className="text-xs text-gray-600 mt-1">Description: {details?.orgPool?.event?.description || "-"}</p>
                  </div>
                  <div className="border rounded-xl p-4">
                    <p className="text-sm font-semibold mb-1">Pool</p>
                    <p className="text-sm text-gray-700">{details?.pool?.name || "Organizer Pool"}</p>
                    <p className="text-xs text-gray-600">Status: {details?.orgPool?.status || "active"}</p>
                    <p className="text-xs text-gray-600">Capacity: {details?.orgPool?.capacity || "-"}</p>
                  </div>
                </div>
              </>
            )}
            {showJoinForm && (
              <>
                <h4 className="font-semibold mt-6 mb-2">Join Request</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Proposed Rate (INR)</label>
                    <input type="number" min={0} step="1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="w-full border rounded-md px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Cover Message</label>
                    <textarea value={cover} onChange={(e) => setCover(e.target.value)} className="w-full border rounded-md px-3 py-2" rows={3} />
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md"
                    onClick={() => join(details?.pool?._id)}
                    disabled={
                      !details?.pool?._id ||
                      joinedPoolIds.has(details?.pool?._id) ||
                      appliedPoolIds.has(details?.pool?._id)
                    }
                    title={!details?.pool?._id ? "Loading pool..." : "Send join request"}
                  >
                    {joinedPoolIds.has(details?.pool?._id) ? "You are in pool" : appliedPoolIds.has(details?.pool?._id) ? "Requested" : "Send Request"}
                  </button>
                  <button className="px-4 py-2 border rounded-md" onClick={() => setShowJoinForm(false)}>Close</button>
                </div>
              </>
            )}
            {!showJoinForm && (
              <div className="mt-4">
                <button className="px-4 py-2 border rounded-md" onClick={() => setSelected(null)}>Close</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default GigPools;
