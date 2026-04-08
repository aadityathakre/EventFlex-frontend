import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import { useNavigate } from "react-router-dom";
import { getEventTypeImage } from "../../utils/imageMaps.js";
import { FaTrash, FaComments, FaCheckCircle, FaCalendarAlt } from "react-icons/fa";

function HostOrganizerPools() {
  const navigate = useNavigate();
  const [assignedPools, setAssignedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // active | upcoming | completed

  const loadPools = async () => {
    try {
      const res = await axios.get(`${serverURL}/host/organizer`, { withCredentials: true });
      setAssignedPools(res.data?.data || []);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch organizer pools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  const poolsByTab = (() => {
    const now = new Date();
    return assignedPools.filter(p => {
      const eventStatus = p?.event?.status || 'pending';
      const poolStatus = p?.status;
      const startDate = p?.event?.start_date ? new Date(p.event.start_date) : null;
      const endDate = p?.event?.end_date ? new Date(p.event.end_date) : null;

      const isCompleted = eventStatus === "completed" || poolStatus === "completed" || (endDate && now > endDate);
      // An event is active if it's not completed AND (explicitly active OR started based on time)
      const isActive = !isCompleted && (eventStatus === 'in_progress' || eventStatus === 'active' || (startDate && now >= startDate));
      
      if (activeTab === "completed") return isCompleted;
      if (activeTab === "active") return isActive;
      if (activeTab === "upcoming") return !isCompleted && !isActive;
      
      return false;
    });
  })();

  const handleDeletePool = async (poolId) => {
    if(!window.confirm("Are you sure you want to delete this pool?")) return;
    try {
      await axios.delete(`${serverURL}/host/pools/${poolId}`, { withCredentials: true });
      loadPools();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete organizer pool');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organizer pools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold transition-colors">Back</button>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Organizer Pools</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 shadow-sm border border-red-100">{error}</div>}
        
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex p-1 space-x-1 bg-white rounded-xl shadow-md border border-slate-100">
            {["active", "upcoming", "completed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 capitalize ${
                  activeTab === tab 
                  ? "bg-indigo-600 text-white shadow-md transform scale-105" 
                  : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {poolsByTab.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FaCalendarAlt className="text-3xl text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No pools found</h3>
            <p className="text-slate-500 max-w-sm">
              There are no {activeTab} organizer pools at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {poolsByTab.map((p) => (
              <div key={p._id} className="group relative bg-white rounded-2xl border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                   {activeTab === 'completed' ? (
                       <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-md border border-green-200 flex items-center gap-1">
                           <FaCheckCircle size={10} /> Completed
                       </span>
                   ) : activeTab === 'active' ? (
                       <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-md border border-blue-200">
                           Active
                       </span>
                   ) : (
                       <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-md border border-amber-200">
                           Upcoming
                       </span>
                   )}
                </div>

                {/* Banner */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={getEventTypeImage(p?.event?.event_type)}
                    alt={p?.event?.event_type || "Event"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
                  
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md truncate">
                      {p.pool_name || p?.event?.title}
                    </h3>
                    <p className="text-slate-200 text-xs mt-1 truncate">
                      {p?.event?.title}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Organizer:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[150px]" title={p?.organizer?.email}>
                        {p?.organizer?.email || "Unknown"}
                      </span>
                    </div>
                    {p?.max_capacity && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Capacity:</span>
                        <span className="font-medium text-slate-700">{p.max_capacity} people</span>
                      </div>
                    )}
                    {p?.required_skills && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Skills:</span>
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{p.required_skills}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/host/events/${p?.event?._id}`)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                  >
                    View Event
                  </button>
                  
                  {activeTab === "completed" ? (
                    <button
                      onClick={() => handleDeletePool(p._id)}
                      className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                      title="Delete Pool"
                    >
                      <FaTrash />
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.post(`${serverURL}/host/chat`, { organizerId: p?.organizer?._id, eventId: p?.event?._id, poolId: p?._id }, { withCredentials: true });
                          const convId = res.data?.data?.conversation?._id;
                          if (convId) navigate(`/host/chat/${convId}`);
                        } catch (e) {
                          setError(e.response?.data?.message || 'Failed to start chat');
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <FaComments /> Chat
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default HostOrganizerPools;
