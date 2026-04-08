import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import { useNavigate } from "react-router-dom";
import { getEventTypeImage } from "../../utils/imageMaps.js";

function HostInvites() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [poolForm, setPoolForm] = useState({ open: false, organizerId: "", eventId: "", pool_name: "", max_capacity: 10, required_skills: "", pay_min: "", pay_max: "", lat: "", lng: "" });

  const loadInvites = async () => {
    try {
      const res = await axios.get(`${serverURL}/host/organizers/invites`, { withCredentials: true });
      const data = res.data?.data || [];
      // Show only host-invited applications: those without a proposed_rate
      const invitedOnly = data.filter((app) => app?.proposed_rate === undefined || app?.proposed_rate === null);
      setApplications(invitedOnly);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch invited organizers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const openPoolForm = (organizerId, eventId) => {
    setPoolForm((f) => ({ ...f, open: true, organizerId, eventId }));
  };

  const createPool = async () => {
    const payMin = parseFloat(poolForm.pay_min);
    const payMax = parseFloat(poolForm.pay_max);
    if (!poolForm.pool_name || !poolForm.organizerId || !poolForm.eventId) {
      setError("Provide pool name and linked organizer/event");
      return;
    }
    if (isNaN(payMin) || isNaN(payMax)) {
      setError("Enter valid pay range");
      return;
    }
    const lat = parseFloat(poolForm.lat);
    const lng = parseFloat(poolForm.lng);
    if (isNaN(lat) || isNaN(lng)) {
      setError("Enter valid location coordinates");
      return;
    }
    try {
      const payload = {
        organizerId: poolForm.organizerId,
        eventId: poolForm.eventId,
        pool_name: poolForm.pool_name,
        location: { coordinates: [lng, lat] },
        max_capacity: Number(poolForm.max_capacity) || 10,
        required_skills: poolForm.required_skills,
        pay_range: { min: payMin, max: payMax },
      };
      await axios.post(`${serverURL}/host/pools/create`, payload, { withCredentials: true });
      setPoolForm({ open: false, organizerId: "", eventId: "", pool_name: "", max_capacity: 10, required_skills: "", pay_min: "", pay_max: "", lat: "", lng: "" });
      await loadInvites();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create organizer pool");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invited organizers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold">Back</button>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Organizers Status</h1>
            <div></div>
          </div>
          {/* Top toggle buttons to switch between pages */}
          <div className="m-4 p-4 mb-5 flex items-center gap-2">
            <button onClick={() => navigate('/host/invites')} className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white">Invited</button>
            <button onClick={() => navigate('/host/requests')} className="px-3 py-2 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50">Requested</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4">{error}</div>}
        {applications.length === 0 ? (
          <p className="text-gray-600">No invitations yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => {
              const statusClass = app.application_status === 'accepted'
                ? 'bg-green-100 text-green-700'
                : app.application_status === 'rejected'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700';

              return (
                <div key={app._id} className="group rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
                  {app?.event?.event_type && (
                    <div className="h-32 w-full overflow-hidden">
                      <img
                        src={getEventTypeImage(app.event.event_type)}
                        alt={app.event.event_type}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4 flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{app?.event?.title || "Event"}</p>
                      <p className="text-sm text-slate-600">Organizer: {app?.applicant?.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusClass}`}>{app.application_status}</span>
                  </div>
                  {app.application_status === 'pending' && (
                    <p className="mt-3 text-sm text-slate-500">Invitation sent • Awaiting organizer response</p>
                  )}
                  {app.application_status === 'accepted' && (
                    <div className="mt-4">
                      <button onClick={() => openPoolForm(app.applicant?._id, app.event?._id)} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">Create Organizer Pool</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {poolForm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPoolForm((f) => ({ ...f, open: false }))}></div>
          <div className="relative z-10 bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h4 className="text-lg font-semibold mb-4">Create Organizer Pool</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={poolForm.pool_name} onChange={(e) => setPoolForm((f) => ({ ...f, pool_name: e.target.value }))} placeholder="Pool name" className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" min="1" value={poolForm.max_capacity} onChange={(e) => setPoolForm((f) => ({ ...f, max_capacity: e.target.value }))} placeholder="Max capacity" className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input value={poolForm.required_skills} onChange={(e) => setPoolForm((f) => ({ ...f, required_skills: e.target.value }))} placeholder="Required skills (comma-separated)" className="border rounded-lg px-3 py-2 text-sm w-full mb-3" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="number" value={poolForm.pay_min} onChange={(e) => setPoolForm((f) => ({ ...f, pay_min: e.target.value }))} placeholder="Pay min (₹)" className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={poolForm.pay_max} onChange={(e) => setPoolForm((f) => ({ ...f, pay_max: e.target.value }))} placeholder="Pay max (₹)" className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input type="number" value={poolForm.lat} onChange={(e) => setPoolForm((f) => ({ ...f, lat: e.target.value }))} placeholder="Lat" className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={poolForm.lng} onChange={(e) => setPoolForm((f) => ({ ...f, lng: e.target.value }))} placeholder="Lng" className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setPoolForm((f) => ({ ...f, open: false }))} className="px-3 py-2 text-sm border rounded-lg">Cancel</button>
              <button onClick={createPool} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostInvites;