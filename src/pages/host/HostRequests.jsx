import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App";
import { useNavigate } from "react-router-dom";

function HostRequests() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRequests = async () => {
    try {
      const res = await axios.get(`${serverURL}/host/organizers/invites`, { withCredentials: true });
      const data = res.data?.data || [];
      const requestsOnly = data.filter((app) => app?.proposed_rate !== undefined && app?.proposed_rate !== null);
      setApplications(requestsOnly);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch requested organizers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const approveApplication = async (appId) => {
    try {
      await axios.post(`${serverURL}/host/approve-organizer/${appId}`, {}, { withCredentials: true });
      await loadRequests();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to approve organizer");
    }
  };

  const rejectApplication = async (appId) => {
    try {
      await axios.post(`${serverURL}/host/reject-organizer/${appId}`, {}, { withCredentials: true });
      await loadRequests();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to reject organizer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requested organizers...</p>
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
            <button onClick={() => navigate('/host/invites')} className="px-3 py-2 text-sm rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50">Invited</button>
            <button onClick={() => navigate('/host/requests')} className="px-3 py-2 text-sm rounded-lg bg-purple-600 text-white">Requested</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4">{error}</div>}
        {applications.length === 0 ? (
          <p className="text-gray-600">No requests yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => {
              const statusClass = app.application_status === 'accepted'
                ? 'bg-green-100 text-green-700'
                : app.application_status === 'rejected'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700';

              const rateObj = app?.proposed_rate;
              let rateValue = null;
              if (rateObj !== null && rateObj !== undefined) {
                if (typeof rateObj === 'object' && rateObj.$numberDecimal) {
                  rateValue = parseFloat(rateObj.$numberDecimal);
                } else {
                  const num = typeof rateObj === 'string' ? parseFloat(rateObj) : Number(rateObj);
                  rateValue = isNaN(num) ? null : num;
                }
              }

              return (
                <div key={app._id} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{app?.event?.title || "Event"}</p>
                      <p className="text-sm text-slate-600">Organizer: {app?.applicant?.email}</p>
                      {rateValue !== null && (
                        <p className="mt-1 text-xs text-slate-500">Proposed rate: ₹ {rateValue.toLocaleString('en-IN')}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusClass}`}>{app.application_status}</span>
                  </div>
                  {app.application_status === 'pending' && (
                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => approveApplication(app._id)} className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg">Accept</button>
                      <button onClick={() => rejectApplication(app._id)} className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg">Reject</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default HostRequests;