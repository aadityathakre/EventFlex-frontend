import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App";
import TopNavbar from "../../components/TopNavbar.jsx";
import {
  FaUserCircle,
  FaEdit,
  FaCamera,
  FaTrash,
  FaIdCard,
  FaFileSignature,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaUpload,
} from "react-icons/fa";

function OrganizerProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    bio: "",
    location: {},
    availability: {},
    bank_details: {},
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const location = useLocation();
  const getActiveSection = () => {
    const parts = location.pathname.split('/');
    const last = parts[parts.length - 1];
    if (last === 'profile' || last === '') return 'personal';
    if (['edit', 'image', 'documents', 'bank', 'kyc'].includes(last)) return last;
    return 'personal';
  };

  useEffect(() => {
    const section = getActiveSection();
    if (section === 'edit') setEditing(true);
    if (section !== 'edit') setEditing(false);

    // scroll to section
    const sectionId = `organizer-section-${section}`;
    const el = document.getElementById(sectionId);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [location.pathname]);


  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${serverURL}/organizer/profile`, { withCredentials: true });
      const { mergedProfile, documents, kyc } = response.data.data;
      setProfileData({ mergedProfile, documents, kyc });
      const nameParts = mergedProfile.name?.split(" ") || [];
      setFormData({
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || "",
        email: mergedProfile.email || "",
        phone: mergedProfile.phone || "",
        bio: mergedProfile.bio || "",
        location: mergedProfile.location || {},
        availability: mergedProfile.availability || {},
        bank_details: mergedProfile.bank_details || {},
      });
      setError(null);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${serverURL}/organizer/profile`, formData, { withCredentials: true });
      updateUser({ email: formData.email });
      await fetchProfile();
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setUploadingImage(true);
    try {
      await axios.put(`${serverURL}/organizer/profile/image`, formData, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
      await fetchProfile();
      alert("Profile image updated successfully!");
    } catch (err) {
      console.error("Image upload error:", err);
      alert(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm("Are you sure you want to remove your profile image?")) return;
    try {
      await axios.delete(`${serverURL}/organizer/profile/image`, { withCredentials: true });
      await fetchProfile();
      alert("Profile image removed successfully!");
    } catch (err) {
      console.error("Image delete error:", err);
      alert(err.response?.data?.message || "Failed to remove image");
    }
  };

  const handleDocumentUpload = async (type, file) => {
    const formData = new FormData();
    formData.append("fileUrl", file);
    formData.append("type", type);
    setUploadingDoc(type);
    try {
      await axios.post(`${serverURL}/organizer/upload-docs`, formData, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
      await fetchProfile();
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
    } catch (err) {
      console.error("Document upload error:", err);
      alert(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(null);
    }
  };

  const getDocumentStatus = (type) => {
    return profileData?.documents?.find((d) => d.type === type) || null;
  };

  const getStatusBadge = (status) => {
    const styles = {
      verified: "bg-green-100 text-green-800",
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-800"}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate("/organizer/dashboard")} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { mergedProfile, documents = [], kyc } = profileData || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Top Navbar */}
      <TopNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div id="organizer-section-image" className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                {mergedProfile?.profile_image_url ? <img src={mergedProfile.profile_image_url} alt="Profile" className="w-full h-full object-cover" /> : <FaUserCircle className="text-white text-6xl" />}
              </div>
              <div className="absolute bottom-0 right-0 flex space-x-2">
                <label className="cursor-pointer bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors shadow-lg">
                  <FaCamera className="text-sm" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                </label>
                {mergedProfile?.profile_image_url && (
                  <button onClick={handleDeleteImage} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg" disabled={uploadingImage}>
                    <FaTrash className="text-sm" />
                  </button>
                )}
              </div>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{mergedProfile?.name || "Organizer"}</h2>
              <p className="text-gray-600 mb-4">{mergedProfile?.email}</p>
              {kyc && (
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                  {kyc.status === "approved" ? <FaCheckCircle className="text-green-500" /> : <FaClock className="text-yellow-500" />}
                  <span className="text-sm text-gray-600">KYC: {getStatusBadge(kyc.status)}</span>
                </div>
              )}
              <button onClick={() => setEditing(!editing)} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 mx-auto md:mx-0">
                <FaEdit />
                <span>{editing ? "Cancel Editing" : "Edit Profile"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div id="organizer-section-personal" className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h3>
              {editing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                      <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                      <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                    <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all resize-none" placeholder="Tell us about yourself..."></textarea>
                  </div>
                  <div className="flex space-x-4">
                    <button type="submit" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2">
                      <FaSave />
                      <span>Save Changes</span>
                    </button>
                    <button type="button" onClick={() => { setEditing(false); fetchProfile(); }} className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2">
                      <FaTimes />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <FaEnvelope className="text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{mergedProfile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FaPhone className="text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{mergedProfile?.phone}</p>
                    </div>
                  </div>
                  {mergedProfile?.bio && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Bio</p>
                      <p className="text-gray-900">{mergedProfile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div id="organizer-section-documents" className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Documents & Verification</h3>
              <div className="space-y-4">
                {["aadhaar", "pan", "selfie", "signature"].map((docType) => {
                  const doc = getDocumentStatus(docType);
                  return (
                    <div key={docType} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <FaIdCard className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">{docType}</p>
                          {doc ? <p className="text-sm text-gray-600">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p> : <p className="text-sm text-gray-500">Not uploaded</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {doc && getStatusBadge(doc.status)}
                        <label className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold">
                          <FaUpload className="inline mr-2" />
                          {doc ? "Replace" : "Upload"}
                          <input type="file" accept={docType === "signature" ? "image/*" : "image/*,application/pdf"} onChange={(e) => handleDocumentUpload(docType, e.target.files[0])} className="hidden" disabled={uploadingDoc === docType} />
                        </label>
                        {uploadingDoc === docType && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FaFileSignature className="text-purple-600 text-xl" />
                    <div>
                      <p className="font-semibold text-gray-900">E-Signature</p>
                      <p className="text-sm text-gray-600">Upload your digital signature</p>
                    </div>
                  </div>
                  <label className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold">
                    <FaUpload className="inline mr-2" />
                    Upload
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("fileUrl", file);
                      formData.append("type", "signature");
                      try {
                        await axios.post(`${serverURL}/organizer/e-signature`, formData, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
                        await fetchProfile();
                        alert("E-Signature uploaded successfully!");
                      } catch (err) {
                        alert(err.response?.data?.message || "Failed to upload e-signature");
                      }
                    }} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {kyc && (
              <div id="organizer-section-kyc" className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">KYC Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Aadhaar Verification</span>
                    {kyc.aadhaar_verified ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-red-500" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    {getStatusBadge(kyc.status)}
                  </div>
                  {kyc.verified_at && <div><span className="text-sm text-gray-600">Verified: {new Date(kyc.verified_at).toLocaleDateString()}</span></div>}
                </div>
              </div>
            )}
            <div id="organizer-section-bank" className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bank Details</h3>
              {mergedProfile?.bank_details && Object.keys(mergedProfile.bank_details).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(mergedProfile.bank_details).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-600 capitalize">{key.replace(/_/g, " ")}</p>
                      <p className="font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No bank details added</p>
              )}
            </div>
            {mergedProfile?.location && Object.keys(mergedProfile.location).length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <FaMapMarkerAlt className="text-purple-600" />
                  <span>Location</span>
                </h3>
                <div className="space-y-2">
                  {Object.entries(mergedProfile.location).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-600 capitalize">{key.replace(/_/g, " ")}</p>
                      <p className="font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default OrganizerProfile;
