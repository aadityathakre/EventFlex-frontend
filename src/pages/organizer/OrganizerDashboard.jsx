import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { getCardImage, getEventTypeImage } from "../../utils/imageMaps.js";
import {
  FaCalendarCheck,
  FaInbox,
  FaWallet,
  FaTools,
  FaUsers,
  FaComments,
  FaStar,
  FaArrowRight,
  FaTimes,
} from "react-icons/fa";

function OrganizerDashboard() {
  const navigate = useNavigate();
  
  const [recentEvents, setRecentEvents] = useState([]);
  const [viewAllEvents, setViewAllEvents] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${serverURL}/organizer/pools`, { withCredentials: true });
        const pools = res.data?.data || [];
        
        // Map to event+pool structure
        const eventsData = pools
          .map((p) => {
            if (!p.event) return null;
            const rawBudget = p?.event?.budget;
            const normalizedBudget =
              rawBudget?.$numberDecimal ?? rawBudget ?? "N/A";

            return {
              ...p.event,
              poolId: p._id,
              poolName: p.name || p.pool_name,
              gigsCount: p.gigs?.length || 0,
              budget: normalizedBudget,
              organizer: p.organizer || null,
            };
          })
          .filter(Boolean);

        // Filter for Recent Events (active and completed only)
        const now = new Date();
        const activeOrCompletedEvents = eventsData.filter(e => {
            const startDate = e.start_date ? new Date(e.start_date) : null;
            const endDate = e.end_date ? new Date(e.end_date) : null;
            
            // Event is completed if status is completed or end date has passed
            const isCompleted = e.status === 'completed' || (endDate && now > endDate);
            
            // Event is active if status is active/in_progress OR (has started AND hasn't ended yet)
            const hasStarted = startDate && now >= startDate;
            const hasNotEnded = !endDate || now <= endDate;
            const isActive = (e.status === 'active' || e.status === 'in_progress') || (hasStarted && hasNotEnded && !isCompleted);
            
            return isActive || isCompleted;
        });

        // Sort active/completed events: Active first, then by start date desc
        activeOrCompletedEvents.sort((a, b) => {
            const aStartDate = a.start_date ? new Date(a.start_date) : null;
            const bStartDate = b.start_date ? new Date(b.start_date) : null;
            const aIsActive = (a.status === 'active' || a.status === 'in_progress') || 
                             (aStartDate && now >= aStartDate && (!a.end_date || now <= new Date(a.end_date)));
            const bIsActive = (b.status === 'active' || b.status === 'in_progress') || 
                             (bStartDate && now >= bStartDate && (!b.end_date || now <= new Date(b.end_date)));
            
            if (aIsActive && !bIsActive) return -1;
            if (bIsActive && !aIsActive) return 1;
            return (bStartDate || 0) - (aStartDate || 0);
        });

        // For View All Events, show all events regardless of status
        const allEventsSorted = eventsData.filter(e => {
            return e.title && e._id; // Only require basic event data
        }).sort((a, b) => {
            const aStartDate = a.start_date ? new Date(a.start_date) : null;
            const bStartDate = b.start_date ? new Date(b.start_date) : null;
            return (bStartDate || 0) - (aStartDate || 0);
        });

        setAllEvents(allEventsSorted);
        setRecentEvents(activeOrCompletedEvents.slice(0, 3));
      } catch (e) {
        console.warn("Failed to fetch events", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Shared UI helpers
  const ModuleCard = ({ title, description, image, onClick, icon, badgeIcon }) => (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-600/30 to-pink-600/30"></div>
        {badgeIcon && (
          <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-purple-600">
            {badgeIcon}
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Top Navbar */}
      <TopNavbar title="My Dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Features Heading */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
            Features
          </h2>
          <p className="text-gray-600 mt-1">Quick access to organizer tools.</p>
        </div>

        {/* Module Buttons */}
        <div className="flex flex-wrap gap-6 mb-8">
          <div className="basis-[30%] shrink-0">
            <ModuleCard
              title="Get All Events"
              description="Browse and request to organize"
              image={getCardImage("events")}
              onClick={() => navigate("/organizer/events")}
              icon={<FaCalendarCheck className="text-purple-600" />}
            />
          </div>
          <div className="basis-[30%] shrink-0">
            <ModuleCard
              title="Host Status"
              description="Invitations and requests"
              image={getCardImage("hostStatus")}
              onClick={() => navigate("/organizer/host-status")}
              icon={<FaInbox className="text-purple-600" />}
            />
          </div>
          <div className="basis-[30%] shrink-0">
            <ModuleCard
              title="Wallet"
              description="Balance and withdraw"
              image={getCardImage("wallet")}
              onClick={() => navigate("/organizer/wallet")}
              icon={<FaWallet className="text-purple-600" />}
            />
          </div>
          <div className="basis-[30%] shrink-0">
            <ModuleCard
              title="My Pool"
              description="Edit pools and view gigs"
              image={getCardImage("myPools")}
              onClick={() => navigate("/organizer/pools")}
              icon={<FaTools className="text-purple-600" />}
              badgeIcon={<FaComments />}
            />
          </div>
          <div className="basis-[30%] shrink-0">
            <ModuleCard
              title="Pool Applications"
              description="Review gig applications"
              image={getCardImage("poolApplications")}
              onClick={() => navigate("/organizer/pool-applications")}
              icon={<FaUsers className="text-purple-600" />}
            />
          </div>
          <div className="basis-[30%] shrink-0">
            <ModuleCard
              title="Manage Gigs"
              description="View gigs and chat"
              image={getCardImage("manageGigs")}
              onClick={() => navigate("/organizer/manage-gigs")}
              icon={<FaComments className="text-purple-600" />}
            />
          </div>
          <div className="basis-[30%] shrink-0">
            <ModuleCard
              title="Feedback"
              description="Ratings and reviews"
              image={getCardImage("feedback")}
              onClick={() => navigate("/organizer/feedbacks")}
              icon={<FaStar className="text-purple-600" />}
            />
          </div>
        </div>

        {/* Recent Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Events</h2>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setViewAllEvents(true);
              }}
              className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md"
            >
              View All Events
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>
          ) : recentEvents.length === 0 ? (
            <p className="text-gray-600">No recent events found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentEvents.map((ev) => (
                <div key={ev._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                  <div className="h-32 bg-gray-200 relative">
                    <img 
                      src={getEventTypeImage(ev.event_type)} 
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold uppercase ${
                      ev.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ev.status}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 truncate mb-1">{ev.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(ev.start_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><FaUsers className="text-gray-400"/> {ev.gigsCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View All Events Overlay */}
        {viewAllEvents && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewAllEvents(false);
            }}
          >
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600">
                  <div>
                    <h2 className="text-2xl font-bold text-white">All Events</h2>
                    <p className="text-purple-100 text-sm mt-1">Active and Completed Events</p>
                  </div>
                  <button onClick={() => setViewAllEvents(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <FaTimes className="text-white text-xl" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                  {allEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <FaCalendarCheck className="text-6xl mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No events found</p>
                      <p className="text-sm mt-1">Active and completed events will appear here</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-gray-600 bg-white p-3 rounded-lg">
                        Showing {allEvents.length} event(s)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allEvents.map((ev) => (
                      <div key={ev._id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col hover:translate-y-[-4px] transition-transform duration-300">
                         <div className="h-40 relative">
                           <img 
                             src={getEventTypeImage(ev.event_type)} 
                             alt={ev.title}
                             className="w-full h-full object-cover"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                           <div className="absolute bottom-3 left-4 right-4 text-white">
                             <h3 className="font-bold text-lg truncate">{ev.title}</h3>
                             <p className="text-xs opacity-90">{ev.location || "No location"}</p>
                           </div>
                           <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase ${
                              ev.status === 'active' ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-700'
                           }`}>
                             {ev.status}
                           </div>
                         </div>
                         
                         <div className="p-5 flex-1 flex flex-col gap-4">
                           {/* Organizer Details */}
                           {ev.organizer && (
                             <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                               <img 
                                 src={ev.organizer.avatar || "https://via.placeholder.com/40"} 
                                 alt={ev.organizer.fullName || ev.organizer.first_name}
                                 className="w-10 h-10 rounded-full object-cover border-2 border-purple-200"
                               />
                               <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold text-gray-800 truncate">
                                   {ev.organizer.fullName || `${ev.organizer.first_name} ${ev.organizer.last_name}`}
                                 </p>
                                 <p className="text-xs text-gray-500 truncate">{ev.organizer.email}</p>
                               </div>
                             </div>
                           )}
                           
                           <div className="grid grid-cols-2 gap-3">
                             <div className="bg-purple-50 p-3 rounded-xl">
                               <p className="text-xs text-purple-600 font-bold uppercase mb-1">Pool Name</p>
                               <p className="text-sm font-semibold text-gray-800 truncate">{ev.poolName || "N/A"}</p>
                             </div>
                             <div className="bg-indigo-50 p-3 rounded-xl">
                               <p className="text-xs text-indigo-600 font-bold uppercase mb-1">Budget</p>
                               <p className="text-sm font-semibold text-gray-800">₹{ev.budget}</p>
                             </div>
                             <div className="bg-green-50 p-3 rounded-xl">
                               <p className="text-xs text-green-600 font-bold uppercase mb-1">Status</p>
                               <p className="text-sm font-semibold text-gray-800 capitalize">{ev.status}</p>
                             </div>
                             <div className="bg-pink-50 p-3 rounded-xl">
                               <p className="text-xs text-pink-600 font-bold uppercase mb-1">Gigs</p>
                               <p className="text-sm font-semibold text-gray-800">{ev.gigsCount} Workers</p>
                             </div>
                             <div className="bg-blue-50 p-3 rounded-xl">
                               <p className="text-xs text-blue-600 font-bold uppercase mb-1">Start Date</p>
                               <p className="text-sm font-semibold text-gray-800">{ev.start_date ? new Date(ev.start_date).toLocaleDateString() : 'N/A'}</p>
                             </div>
                             <div className="bg-orange-50 p-3 rounded-xl">
                               <p className="text-xs text-orange-600 font-bold uppercase mb-1">End Date</p>
                               <p className="text-sm font-semibold text-gray-800">{ev.end_date ? new Date(ev.end_date).toLocaleDateString() : 'N/A'}</p>
                             </div>
                           </div>
                           
                           <button 
                             onClick={() => {
                               setViewAllEvents(false);
                               navigate("/organizer/pools");
                             }}
                             className="mt-auto w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
                           >
                             Manage Pool <FaArrowRight />
                           </button>
                         </div>
                      </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrganizerDashboard;
