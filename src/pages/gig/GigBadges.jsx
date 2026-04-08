import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNavbar from "../../components/TopNavbar.jsx";
import { serverURL } from "../../App.jsx";
import { useToast } from "../../context/ToastContext.jsx";

function GigBadges() {
  const { showToast } = useToast();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/gigs/badges`, { withCredentials: true });
      const items = res.data?.data || [];
      setBadges(items);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load badges");
      showToast(e?.response?.data?.message || "Failed to load badges", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getBadgeImage = (index) => {
    const images = [
      "/badges/image.png",
      "/badges/image copy.png",
      "/badges/image copy 2.png",
      "/badges/image copy 3.png"
    ];
    return images[index % images.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="My Badges" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">My Achievements</h3>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <p className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</p>
          ) : badges.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No badges awarded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((b, i) => (
                <div key={b._id} className="bg-white border border-purple-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 rounded-full">
                      <img 
                        src={getBadgeImage(i)} 
                        alt="badge" 
                        className="w-12 h-12 object-contain"
                        onError={(e) => e.target.src = "/badges/image.png"}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{b?.badge?.badge_name || "Badge"}</p>
                      <p className="text-xs text-gray-500 mt-1">Awarded on {new Date(b.awarded_at || b.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default GigBadges;
