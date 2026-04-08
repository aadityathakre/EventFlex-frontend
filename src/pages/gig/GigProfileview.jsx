import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import {
  FaUserCircle,
  FaEdit,
  FaCamera,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaArrowLeft,
  FaIdCard,
  FaFileSignature,
  FaTimesCircle,
  FaUpload,
  FaSignOutAlt,
  FaWallet,
  FaRupeeSign,
} from "react-icons/fa";
import TopNavbar from "../../components/TopNavbar.jsx";

function GigProfileView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [walletVisible, setWalletVisible] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [withdrawMode, setWithdrawMode] = useState("upi");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawUPI, setWithdrawUPI] = useState("");
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawBankAccount, setWithdrawBankAccount] = useState("");
  const [withdrawIFSC, setWithdrawIFSC] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(null);
  const location = useLocation();
  const [toast, setToast] = useState(null);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState(null);
  const [kycSuccess, setKycSuccess] = useState("");
  const [showKycForm, setShowKycForm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      
      const response = await axios.get(`${serverURL}/gigs/profile`, {
        withCredentials: true,
      });
      
      const payload = response?.data?.data;
      const mergedProfile = payload?.mergedProfile || payload || {};
      const kycFromPayload = payload?.kyc || null;
      setProfileData((prev) => {
        const documents = Array.isArray(payload?.documents) ? payload.documents : (prev?.documents || []);
        return {
          ...(prev || {}),
          mergedProfile,
          documents,
          ...(kycFromPayload ? { kyc: kycFromPayload } : {}),
        };
      });
      // Fetch KYC status separately for reliability
      try {
        const kycRes = await axios.get(`${serverURL}/gigs/kyc-status`, { withCredentials: true });
        const kycData = kycRes.data?.data || null;
        setProfileData((prev) => ({ ...(prev || {}), kyc: kycData }));
      } catch {}
      setError(null);
    } catch (err) {
      console.error("❌ Profile fetch error:", err);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);
      const errorMessage = err.response?.data?.message || "Failed to load profile";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setUploadingImage(true);
    try {
      await axios.put(`${serverURL}/gigs/profile-image`, formData, {
        withCredentials: true,
      });
      await fetchProfile();
      setShowImageUpload(false);
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
      await axios.delete(`${serverURL}/gigs/profile-image`, {
        withCredentials: true,
      });
      await fetchProfile();
      alert("Profile image removed successfully!");
    } catch (err) {
      console.error("Image delete error:", err);
      alert(err.response?.data?.message || "Failed to remove image");
    }
  };

  const handleDocumentUpload = async (docType, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("fileUrl", file);
    formData.append("type", docType);
    
    // Debug: Log what we're sending
    console.log("📤 Uploading document...");
    console.log("Document Type:", docType);
    console.log("File:", file.name, file.size, file.type);
    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value);
    }
    
    setUploadingDoc(docType);
    try {
      await axios.post(`${serverURL}/gigs/upload-documents`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchProfile();
      alert(`${docType.charAt(0).toUpperCase() + docType.slice(1)} uploaded successfully!`);
    } catch (err) {
      // If a single-document-per-user conflict occurs, fallback to update
      const isConflict = err?.response?.status === 409;
      if (isConflict) {
        try {
          await axios.put(`${serverURL}/gigs/update-docs`, formData, {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          });
          await fetchProfile();
          alert(`${docType.charAt(0).toUpperCase() + docType.slice(1)} updated successfully!`);
        } catch (e) {
          console.error("Document update error:", e);
          alert(e.response?.data?.message || "Failed to update document");
        }
      } else {
        console.error("Document upload error:", err);
        console.error("Response data:", err.response?.data);
        alert(err.response?.data?.message || "Failed to upload document");
      }
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      verified: "bg-green-100 text-green-800",
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  // Show success/error toast if coming back from Razorpay page
  useEffect(() => {
    const state = location.state;
    if (state?.toast) {
      setToast(state.toast);
      // Optionally reveal wallet with updated balance
      if (state.wallet?.visible) {
        setWalletVisible(true);
        if (state.wallet.balance !== undefined && state.wallet.balance !== null) {
          setWalletBalance(state.wallet.balance);
        }
      }
      // Clear navigation state to avoid duplicate toasts on reload
      setTimeout(() => {
        setToast(null);
      }, 3000);
      // Replace history state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
          <button
            onClick={() => navigate("/gig/dashboard")}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const mergedProfile = (profileData?.mergedProfile) || profileData || {};
  const documents = profileData?.documents || [];
  const kyc = profileData?.kyc || null;
  const hasBankDetails = !!(mergedProfile?.bank_details && Object.keys(mergedProfile.bank_details).length > 0);
  const kycStatus = kyc?.status || "pending";
  const aadhaarLast4 = kyc?.aadhaar_number ? kyc.aadhaar_number.slice(-4) : "";

  const handleKycSubmit = async () => {
    setKycError(null);
    setKycSuccess("");
    const aadhaarOk = /^\d{12}$/.test(aadhaarNumber);
    const otpOk = /^\d{6}$/.test(otp);
    if (!aadhaarOk) {
      setKycError("Enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!otpOk) {
      setKycError("Enter a valid 6-digit OTP");
      return;
    }
    setKycSubmitting(true);
    try {
      await axios.post(
        `${serverURL}/gigs/aadhaar/verify`,
        { aadhaar_number: aadhaarNumber, otp },
        { withCredentials: true }
      );
      setKycSuccess("KYC submitted and verified successfully");
      setShowKycForm(false);
      setAadhaarNumber("");
      setOtp("");
      await fetchProfile();
    } catch (err) {
      setKycError(err.response?.data?.message || "Failed to submit KYC");
    } finally {
      setKycSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Top Navbar */}
      <TopNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar Section with Image Upload Modal */}
            <div className="relative group">
              <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                {mergedProfile?.profile_image_url ? (
                  <img
                    src={mergedProfile.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="text-white text-8xl" />
                )}
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center cursor-pointer"
                onClick={() => setShowImageUpload(true)}>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                  <FaCamera className="text-4xl mb-2 mx-auto" />
                  <p className="text-sm font-semibold">Change Photo</p>
                </div>
              </div>

              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                {mergedProfile?.name || "Gig User"}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center md:justify-start space-x-3">
                  <FaEnvelope className="text-purple-600 text-lg" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">
                      {mergedProfile?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-start space-x-3">
                  <FaPhone className="text-purple-600 text-lg" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">
                      {mergedProfile?.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* KYC Status */}
              {kyc && (
                <div className="flex items-center justify-center md:justify-start space-x-3 mb-6">
                  {kyc.status === "approved" ? (
                    <FaCheckCircle className="text-green-500 text-xl" />
                  ) : (
                    <FaClock className="text-yellow-500 text-xl" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">KYC Status</p>
                    <p className="font-semibold">
                      {getStatusBadge(kyc.status)}
                    </p>
                  </div>
                </div>
              )}

              {/* Edit Button */}
              <button
                onClick={() => navigate("/gig/profile/edit")}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 mx-auto md:mx-0"
              >
                <FaEdit />
                <span>Edit All Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {mergedProfile?.bio && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">About</h3>
            <p className="text-gray-700 leading-relaxed">{mergedProfile.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FaMapMarkerAlt className="text-purple-600" />
              <span>Location</span>
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">City</p>
                <p className="font-semibold text-gray-900">{mergedProfile?.location?.city || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">State</p>
                <p className="font-semibold text-gray-900">{mergedProfile?.location?.state || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Country</p>
                <p className="font-semibold text-gray-900">{mergedProfile?.location?.country || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold text-gray-900">{mergedProfile?.location?.address || mergedProfile?.location?.street || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Coordinates</p>
                <p className="font-semibold text-gray-900">
                  {Array.isArray(mergedProfile?.location?.coordinates) && mergedProfile.location.coordinates.length >= 2
                    ? `${mergedProfile.location.coordinates[1]}, ${mergedProfile.location.coordinates[0]}`
                    : (mergedProfile?.location?.lat !== undefined && mergedProfile?.location?.lng !== undefined
                      ? `${mergedProfile.location.lat}, ${mergedProfile.location.lng}`
                      : "-")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <FaIdCard className="text-indigo-600" />
              <span>Bank Details</span>
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold text-gray-900">{mergedProfile?.location?.address || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Holder</p>
                <p className="font-semibold text-gray-900">{mergedProfile?.bank_details?.account_holder || mergedProfile?.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bank Name</p>
                <p className="font-semibold text-gray-900">{mergedProfile?.bank_details?.bank_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="font-semibold text-gray-900">{mergedProfile?.bank_details?.account_number || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ifsc Code</p>
                <p className="font-semibold text-gray-900">{mergedProfile?.bank_details?.ifsc_code || "-"}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <button
                onClick={async () => {
                  setWalletVisible(true);
                  setWalletLoading(true);
                  setWalletError(null);
                  setWalletBalance(null);
                  try {
                    const res = await axios.get(`${serverURL}/gigs/wallet`, { withCredentials: true });
                    const data = res.data?.data || res.data;
                    const raw = data?.balance_inr ?? data?.balance;
                    const num = typeof raw === "object" && raw?.$numberDecimal ? parseFloat(raw.$numberDecimal) : parseFloat(raw ?? 0);
                    setWalletBalance(Number.isFinite(num) ? num : null);
                  } catch (err) {
                    setWalletError(err.response?.data?.message || "Failed to fetch wallet balance");
                  } finally {
                    setWalletLoading(false);
                  }
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <FaWallet className="text-lg" />
                <span>Show Balance</span>
              </button>
              {walletVisible && (
                <button
                  onClick={() => {
                    setWithdrawVisible((v) => !v);
                    setWithdrawSuccess(null);
                    setWithdrawError(null);
                  }}
                  className="px-6 py-3 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <FaSignOutAlt className="text-lg" />
                  <span>Withdraw</span>
                </button>
              )}
            </div>
            {walletVisible && (
              <div className="mt-4 p-4 border-2 border-indigo-200 rounded-xl bg-indigo-50 space-y-3">
                {walletLoading && (
                  <div className="flex items-center space-x-2 text-indigo-700">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span className="text-sm font-semibold">Fetching balance...</span>
                  </div>
                )}
                {!walletLoading && walletError && (
                  <div className="text-red-700 text-sm font-semibold">{walletError}</div>
                )}
                {!walletLoading && !walletError && walletBalance !== null && (
                  <div className="flex items-center justify-between bg-white rounded-md px-3 py-2 border">
                    <div className="flex items-center space-x-2">
                      <FaRupeeSign className="text-indigo-700" />
                      <p className="text-sm text-gray-700">Current Wallet Balance</p>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900">₹ {parseFloat(walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                )}
                {withdrawVisible && !walletLoading && !walletError && (
                  <div className="mt-4 bg-white border rounded-xl p-4 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Withdraw Funds <span className="text-xs text-gray-500 font-normal">(Simulated Razorpay • Test Mode)</span></h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Amount (INR)</label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., 1000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Destination</label>
                        <select
                          value={withdrawMode}
                          onChange={(e) => setWithdrawMode(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="upi">UPI</option>
                          <option value="bank">Bank</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Beneficiary Name</label>
                        <input
                          type="text"
                          value={withdrawName}
                          onChange={(e) => setWithdrawName(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Recipient name"
                        />
                      </div>
                      {withdrawMode === "upi" ? (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">UPI ID</label>
                          <input
                            type="text"
                            value={withdrawUPI}
                            onChange={(e) => setWithdrawUPI(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="example@bank"
                          />
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Account Number</label>
                            <input
                              type="text"
                              value={withdrawBankAccount}
                              onChange={(e) => setWithdrawBankAccount(e.target.value)}
                              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="0000 0000 0000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">IFSC</label>
                            <input
                              type="text"
                              value={withdrawIFSC}
                              onChange={(e) => setWithdrawIFSC(e.target.value)}
                              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="ABCD0123456"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    {withdrawError && (
                      <p className="mt-3 text-sm text-red-600 font-semibold">{withdrawError}</p>
                    )}
                    {withdrawSuccess && (
                      <div className="mt-3 p-3 border rounded-md bg-green-50 text-green-700">
                        <p className="text-sm font-semibold">Withdrawal successful.</p>
                        <p className="text-xs">UTR: {withdrawSuccess?.payout?.utr}</p>
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={async () => {
                          setWithdrawError(null);
                          setWithdrawSuccess(null);
                          try {
                            const amountNum = parseFloat(withdrawAmount);
                            if (isNaN(amountNum) || amountNum <= 0) {
                              throw new Error("Enter a valid amount greater than 0");
                            }
                            if (walletBalance !== null && amountNum > parseFloat(walletBalance)) {
                              throw new Error("Amount exceeds available wallet balance");
                            }
                            const prefill = {
                              name: mergedProfile?.name || "Gig User",
                              email: mergedProfile?.email || user?.email || "",
                              contact: mergedProfile?.phone || "9999999999",
                            };
                            navigate("/razorpay", {
                              state: {
                                checkoutPurpose: "withdraw",
                                amount: amountNum,
                                mode: withdrawMode,
                                beneficiary_name: withdrawName,
                                ...(withdrawMode === "upi"
                                  ? { upi_id: withdrawUPI }
                                  : { account_number: withdrawBankAccount, ifsc: withdrawIFSC }),
                                prefill,
                                returnPath: "/gig/profile",
                              },
                            });
                          } catch (err) {
                            const msg = err.response?.data?.message || err.message || "Failed to withdraw";
                            setWithdrawError(msg);
                          } finally {
                          }
                        }}
                        disabled={withdrawLoading}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {withdrawLoading ? "Processing..." : "Confirm Withdraw"}
                      </button>
                      <button
                        onClick={() => {
                          setWithdrawVisible(false);
                          setWithdrawAmount("");
                          setWithdrawUPI("");
                          setWithdrawName("");
                          setWithdrawBankAccount("");
                          setWithdrawIFSC("");
                          setWithdrawError(null);
                          setWithdrawSuccess(null);
                        }}
                        className="px-6 py-2 bg-gray-100 text-gray-800 rounded-md font-semibold hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* KYC Verification Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">KYC Verification</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {kycStatus === "approved" ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaClock className="text-yellow-500" />
              )}
              <div>
                <p className="text-sm text-gray-600">Current Status</p>
                <p className="font-semibold">{getStatusBadge(kycStatus)}</p>
              </div>
            </div>
            {kycStatus !== "approved" && (
              <button
                onClick={() => setShowKycForm((v) => !v)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                {showKycForm ? "Hide Form" : "Do KYC"}
              </button>
            )}
          </div>

          {kycStatus === "approved" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Aadhaar Verified</span>
                <FaCheckCircle className="text-green-500" />
              </div>
              {kyc?.aadhaar_number && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Aadhaar Number</span>
                  <span className="font-semibold text-gray-900">**** **** **** {aadhaarLast4}</span>
                </div>
              )}
              {kyc?.verified_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verified On</span>
                  <span className="font-semibold text-gray-900">{new Date(kyc.verified_at).toLocaleDateString('en-GB')}</span>
                </div>
              )}
              {kyc?.video_kyc_url && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Video KYC</span>
                  <a href={kyc.video_kyc_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View</a>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {kycError && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{kycError}</div>
              )}
              {kycSuccess && (
                <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{kycSuccess}</div>
              )}
              {showKycForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Aadhaar Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^\d]/g, ""))}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 outline-none"
                      placeholder="Enter 12-digit Aadhaar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">OTP (6 digits)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 outline-none"
                      placeholder="Enter OTP"
                    />
                    <p className="text-xs text-gray-500 mt-1">OTP sending is not implemented; any 6-digit OTP works.</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                {showKycForm && (
                  <button
                    onClick={handleKycSubmit}
                    disabled={kycSubmitting}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                  >
                    {kycSubmitting ? "Submitting..." : "Submit KYC"}
                  </button>
                )}
                {showKycForm && (
                  <button
                    onClick={() => { setShowKycForm(false); setKycError(null); setKycSuccess(""); }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Documents Status Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Document Status
          </h3>
          
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FaFileSignature className="text-gray-400 text-5xl mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-600">
                Please upload any document first
              </p>
            </div>
          ) : (
            <div className="max-w-md">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <FaFileSignature className="text-purple-600" />
                      </div>
                      <p className="font-semibold text-gray-900 capitalize">
                        {doc.type}
                      </p>
                    </div>
                    
                    {doc.status === "verified" && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <FaCheckCircle /> <span>Verified</span>
                      </span>
                    )}
                    {doc.status === "approved" && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <FaCheckCircle /> <span>Approved</span>
                      </span>
                    )}
                    {doc.status === "pending" && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <FaClock /> <span>Pending</span>
                      </span>
                    )}
                    {doc.status === "rejected" && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <FaTimesCircle /> <span>Rejected</span>
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload/Update Document Section */}
        {documents.length === 0 ? (
          // No Document - Show Upload Section
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2 mb-6">
              <FaFileSignature className="text-purple-600" />
              <span>Upload Document</span>
            </h3>

            <div className="text-center py-8">
              <FaFileSignature className="text-gray-400 text-5xl mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-600">
                Upload a document
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Choose a document type and upload your file below
              </p>
            </div>

            <div className="max-w-2xl">
              <div className="space-y-4">
                {/* Document Type Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Document Type
                  </label>
                  <select
                    value={uploadingDoc || ""}
                    onChange={(e) => setUploadingDoc(e.target.value || null)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 focus:border-purple-600 focus:outline-none transition-colors"
                  >
                    <option value="">-- Choose Document Type --</option>
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="selfie">Selfie</option>
                    <option value="signature">Signature</option>
                  </select>
                </div>

                {/* File Upload Section */}
                {uploadingDoc && uploadingDoc !== "" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Choose File
                    </label>
                    <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-600 hover:bg-purple-50 transition-all">
                      <div className="text-center">
                        <FaUpload className="text-purple-600 text-4xl mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-700">
                          Click to upload {uploadingDoc.charAt(0).toUpperCase() + uploadingDoc.slice(1)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadingDoc === "signature" ? "PNG, JPG up to 5MB" : "Images or PDF up to 5MB"}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept={uploadingDoc === "signature" ? "image/*" : "image/*,application/pdf"}
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleDocumentUpload(uploadingDoc, e.target.files[0]);
                            setTimeout(() => setUploadingDoc(null), 1000);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Document Already Uploaded - Show View & Update Buttons Only
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            {!uploadingDoc || uploadingDoc === "" ? (
              // Buttons View
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const latestDoc = documents[0];
                    if (latestDoc.fileUrl) {
                      window.open(latestDoc.fileUrl, "_blank");
                    }
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <FaFileSignature className="text-lg" />
                  <span>View Document</span>
                </button>
                <button
                  onClick={() => {
                    const defaultType = documents[0]?.type || "aadhaar";
                    setUploadingDoc(defaultType);
                  }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <FaEdit className="text-lg" />
                  <span>Update Document</span>
                </button>
              </div>
            ) : (
              // Update Form View
              <div className="max-w-2xl">
                <button
                  onClick={() => setUploadingDoc(null)}
                  className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold"
                >
                  ← Back
                </button>
                <div className="space-y-4">
                  {/* Document Type Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Document Type
                    </label>
                    <select
                      value={uploadingDoc || ""}
                      onChange={(e) => setUploadingDoc(e.target.value || null)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 focus:border-purple-600 focus:outline-none transition-colors"
                    >
                      <option value="">-- Choose Document Type --</option>
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="selfie">Selfie</option>
                      <option value="signature">Signature</option>
                    </select>
                  </div>

                  {/* File Upload Section */}
                  {uploadingDoc && uploadingDoc !== "" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Choose File
                      </label>
                      <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-600 hover:bg-purple-50 transition-all">
                        <div className="text-center">
                          <FaUpload className="text-purple-600 text-4xl mx-auto mb-3" />
                          <p className="text-sm font-semibold text-gray-700">
                            Click to upload new {uploadingDoc.charAt(0).toUpperCase() + uploadingDoc.slice(1)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {uploadingDoc === "signature" ? "PNG, JPG up to 5MB" : "Images or PDF up to 5MB"}
                          </p>
                        </div>
                        <input
                          type="file"
                          accept={uploadingDoc === "signature" ? "image/*" : "image/*,application/pdf"}
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleDocumentUpload(uploadingDoc, e.target.files[0]);
                              setTimeout(() => setUploadingDoc(null), 1000);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Logout Button */}
      <div className="flex items-center justify-center mb-8">
        <button
          onClick={handleLogout}
          className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>

      {/* Success/Error Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <p className="font-semibold">{toast.title}</p>
          {toast.message && <p className="mt-1 text-xs">{toast.message}</p>}
        </div>
      )}
      </main>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Change Profile Photo
            </h3>

            <div className="space-y-4">
              {/* Upload New Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload New Photo
                </label>
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-600 hover:bg-purple-50 transition-all duration-300">
                  <div className="text-center">
                    <FaCamera className="text-purple-600 text-3xl mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      Click to upload
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {mergedProfile?.profile_image_url && (
                <button
                  onClick={handleDeleteImage}
                  className="w-full px-4 py-3 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <FaTrash />
                  <span>Remove Current Photo</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => setShowImageUpload(false)}
                disabled={uploadingImage}
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
            </div>

            {uploadingImage && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Uploading...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GigProfileView;
