import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App";
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaUserCircle,
  FaPhone,
  FaEnvelope,
  FaFileAlt,
  FaMapMarkerAlt,
  FaWallet,
} from "react-icons/fa";

function GigProfileEdit() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [walletInfo, setWalletInfo] = useState({ upi_id: "", balance_inr: 0 });
  const [walletVisible, setWalletVisible] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
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
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    bio: "",
    location: {
      city: "",
      state: "",
      country: "",
    },
    bank_details: {
      account_holder: "",
      account_number: "",
      ifsc_code: "",
      bank_name: "",
    },
  });

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
      setProfileData(mergedProfile);

      const nameParts = mergedProfile.name?.split(" ") || [];
      setFormData({
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || "",
        email: mergedProfile.email || "",
        phone: mergedProfile.phone || "",
        bio: mergedProfile.bio || "",
        location: mergedProfile.location || {
          city: "",
          state: "",
          country: "",
        },
        bank_details: mergedProfile.bank_details || {
          account_holder: "",
          account_number: "",
          ifsc_code: "",
          bank_name: "",
        },
      });
      setError(null);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const res = await axios.get(`${serverURL}/gigs/wallet`, { withCredentials: true });
        const upi = res.data?.data?.upi_id || "";
        const balRaw = res.data?.data?.balance_inr ?? res.data?.data?.balance;
        const bal = typeof balRaw === "object" && balRaw?.$numberDecimal ? parseFloat(balRaw.$numberDecimal) : parseFloat(balRaw ?? 0);
        setWalletInfo({ upi_id: upi, balance_inr: Number.isFinite(bal) ? bal : 0 });
      } catch (e) {}
    };
    loadWallet();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const handleBankChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      bank_details: { ...prev.bank_details, [field]: value },
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${serverURL}/gigs/profile`, formData, {
        withCredentials: true,
      });
      updateUser({ email: formData.email });
      alert("Profile updated successfully!");
      navigate("/gig/profile");
    } catch (err) {
      console.error("Profile update error:", err);
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
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
          <button
            onClick={() => navigate("/gig/profile")}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/gig/profile")}
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                EventFlex
              </h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700 font-medium">Edit Profile</span>
            </div>
              <button
                onClick={() => navigate("/gig/profile")}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-semibold transition-all duration-300"
              >
                Cancel
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FaUserCircle className="text-purple-600 text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                  placeholder="Doe"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center space-x-2">
                  <FaEnvelope className="text-purple-600" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center space-x-2">
                  <FaPhone className="text-purple-600" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex text-sm font-semibold text-gray-700 mb-2 items-center space-x-2">
                  <FaFileAlt className="text-purple-600" />
                  <span>Bio / About</span>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaMapMarkerAlt className="text-indigo-600 text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Location</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.location.city || ""}
                  onChange={(e) => handleLocationChange("city", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State / Province
                </label>
                <input
                  type="text"
                  value={formData.location.state || ""}
                  onChange={(e) => handleLocationChange("state", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="NY"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.location.country || ""}
                  onChange={(e) =>
                    handleLocationChange("country", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="United States"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.location.address || ""}
                  onChange={(e) => handleLocationChange("address", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="Street, Area, Landmark"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.location.lat ?? ""}
                  onChange={(e) => handleLocationChange("lat", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="28.6139"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.location.lng ?? ""}
                  onChange={(e) => handleLocationChange("lng", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                  placeholder="77.2090"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <FaWallet className="text-green-600 text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Bank Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.bank_details.account_holder || ""}
                  onChange={(e) =>
                    handleBankChange("account_holder", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bank_details.bank_name || ""}
                  onChange={(e) => handleBankChange("bank_name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all"
                  placeholder="Chase Bank"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.bank_details.account_number || ""}
                  onChange={(e) =>
                    handleBankChange("account_number", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all"
                  placeholder="1234567890"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  IFSC Code (for India) / Bank Code
                </label>
                <input
                  type="text"
                  value={formData.bank_details.ifsc_code || ""}
                  onChange={(e) => handleBankChange("ifsc_code", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all"
                  placeholder="CHASUS33"
                />
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaWallet className="text-indigo-600 text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={walletInfo.upi_id}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Manage payout destination in Wallet page.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Wallet Balance (INR)
                </label>
                <input
                  type="text"
                  value={`₹ ${(walletInfo.balance_inr || 0).toFixed(2)}`}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  setWalletVisible(true);
                  setWalletLoading(true);
                  try {
                    const res = await axios.get(`${serverURL}/gigs/wallet`, { withCredentials: true });
                    const balRaw = res.data?.data?.balance_inr ?? res.data?.data?.balance;
                    const bal = typeof balRaw === "object" && balRaw?.$numberDecimal ? parseFloat(balRaw.$numberDecimal) : parseFloat(balRaw ?? 0);
                    setWalletInfo((w) => ({ ...w, balance_inr: Number.isFinite(bal) ? bal : 0 }));
                  } catch (e) {}
                  setWalletLoading(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Show Balance
              </button>
              {walletVisible && (
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawVisible((v) => !v);
                    setWithdrawError(null);
                    setWithdrawSuccess(null);
                  }}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg"
                >
                  Withdraw
                </button>
              )}
            </div>
            {walletVisible && (
              <div className="mt-4 p-4 border-2 border-indigo-200 rounded-xl bg-indigo-50 space-y-3">
                {walletLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                ) : (
                  <div className="flex items-center justify-between bg-white rounded-md px-3 py-2 border">
                    <span className="text-sm text-gray-700">Current Wallet Balance</span>
                    <span className="text-xl font-extrabold text-gray-900">₹ {(walletInfo.balance_inr || 0).toFixed(2)}</span>
                  </div>
                )}
                {withdrawVisible && !walletLoading && (
                  <div className="mt-3 bg-white border rounded-xl p-4 shadow-sm">
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
                        type="button"
                        onClick={async () => {
                          setWithdrawError(null);
                          setWithdrawSuccess(null);
                          try {
                            const amountNum = parseFloat(withdrawAmount);
                            if (isNaN(amountNum) || amountNum <= 0) {
                              throw new Error("Enter a valid amount greater than 0");
                            }
                            if (walletInfo.balance_inr !== null && amountNum > parseFloat(walletInfo.balance_inr)) {
                              throw new Error("Amount exceeds available wallet balance");
                            }
                            const prefill = {
                              name: profileData?.name || "Gig User",
                              email: profileData?.email || user?.email || "",
                              contact: profileData?.phone || "9999999999",
                            };
                            navigate("/razorpay", {
                              state: {
                                checkoutPurpose: "withdraw",
                                amount: amountNum,
                                mode: withdrawMode,
                                beneficiary_name: withdrawName,
                                ...(withdrawMode === "upi"
                                  ? { upi_id: withdrawUPI || walletInfo.upi_id }
                                  : { account_number: withdrawBankAccount, ifsc: withdrawIFSC }),
                                prefill,
                                returnPath: "/gig/profile",
                              },
                            });
                          } catch (err) {
                            const msg = err.response?.data?.message || err.message || "Failed to withdraw";
                            setWithdrawError(msg);
                          }
                        }}
                        disabled={withdrawLoading}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md"
                      >
                        {withdrawLoading ? "Processing..." : "Confirm Withdraw"}
                      </button>
                      <button
                        type="button"
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
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <FaSave />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/gig/profile")}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2"
            >
              <FaTimes />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default GigProfileEdit;
