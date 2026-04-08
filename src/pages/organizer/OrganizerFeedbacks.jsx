import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getEventTypeImage } from "../../utils/imageMaps.js";
import { FaStar, FaUser, FaBuilding } from "react-icons/fa";

function OrganizerFeedbacks() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("gigs"); // 'gigs' or 'host'

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/organizer/reviews/my-feedbacks`, { withCredentials: true });
      setReviews(res.data?.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Filter reviews
  // Gigs Feedback: Reviews related to Gigs (Gig -> Organizer only)
  // We want to see reviews GIVEN BY Gigs TO Organizer.
  // The backend might return all reviews where user is involved.
  // review_type should be "gig_to_organizer".
  const gigReviews = reviews.filter(r => 
    r.review_type === "gig_to_organizer"
  );

  // Host Feedback: Reviews related to Hosts (Host -> Organizer)
  const hostReviews = reviews.filter(r => 
    r.review_type === "host_to_organizer"
  );

  const currentReviews = activeTab === "gigs" ? gigReviews : hostReviews;

  const renderStars = (rating) => {
    const r = parseFloat(rating?.$numberDecimal || rating || 0);
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <FaStar key={i} className={i < r ? "fill-current" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <TopNavbar title="My Feedbacks" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("gigs")}
            className={`pb-2 px-4 text-lg font-medium transition-colors ${
              activeTab === "gigs"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Gigs Feedback & Reviews
          </button>
          <button
            onClick={() => setActiveTab("host")}
            className={`pb-2 px-4 text-lg font-medium transition-colors ${
              activeTab === "host"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Host Feedback & Reviews
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : currentReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No {activeTab} reviews found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentReviews.map((review) => {
              const isGivenByMe = review.review_type === "organizer_to_gig";
              const otherUser = isGivenByMe ? review.reviewee : review.reviewer;
              const eventImage = getEventTypeImage(review.event?.event_type);

              return (
                <div key={review._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-32 w-full relative">
                     <img 
                        src={eventImage} 
                        alt={review.event?.title} 
                        className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-black/20" />
                     <div className="absolute bottom-2 left-2 text-white font-bold text-lg drop-shadow-md">
                        {review.event?.title || "Event"}
                     </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img 
                          src={otherUser?.avatar || "https://via.placeholder.com/40"} 
                          alt={otherUser?.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {otherUser?.fullName || "User"}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {isGivenByMe ? "You rated them" : "Rated you"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                         {renderStars(review.rating)}
                         <span className="text-xs text-gray-400 mt-1">
                           {new Date(review.createdAt).toLocaleDateString()}
                         </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 italic">
                      "{review.review_text}"
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizerFeedbacks;
