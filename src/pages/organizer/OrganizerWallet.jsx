import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { FaTrash } from "react-icons/fa";

function OrganizerWallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wallet, setWallet] = useState({ balance: 0, upi_id: "" });
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("org_withdraw_history") || "[]");
    } catch {
      return [];
    }
  });
  const [payments, setPayments] = useState([]);
  const [escrowReleaseHistory, setEscrowReleaseHistory] = useState([]);
  const [showAllPayments, setShowAllPayments] = useState(false);

  // Withdraw UI state (introduced for Razorpay-like experience)
  const [withdrawMode, setWithdrawMode] = useState("upi");
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawUPI, setWithdrawUPI] = useState("");
  const [withdrawBankAccount, setWithdrawBankAccount] = useState("");
  const [withdrawIFSC, setWithdrawIFSC] = useState("");

  // If wallet UPI is available, prefill withdraw UPI when empty
  useEffect(() => {
    if (wallet?.upi_id && !withdrawUPI) {
      setWithdrawUPI(wallet.upi_id);
    }
  }, [wallet?.upi_id]);

  // Helper: normalize Mongo Decimal128 or mixed numeric types to Number
  const asNumber = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const n = parseFloat(val);
      return Number.isNaN(n) ? null : n;
    }
    if (typeof val === "object") {
      if ("$numberDecimal" in val) {
        const n = parseFloat(val.$numberDecimal);
        return Number.isNaN(n) ? null : n;
      }
    }
    return null;
  };

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverURL}/organizer/wallet`, { withCredentials: true });
      const rawBal = res.data?.data?.balance;
      const bal = asNumber(rawBal) ?? 0;
      const upi = res.data?.data?.upi_id || "";
      setWallet({ balance: bal, upi_id: upi });
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to load wallet", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${serverURL}/organizer/payment-history`, { withCredentials: true });
      setPayments(res.data?.data || []);
    } catch (e) {
      void e;
    }
  };

  const fetchEscrowReleaseHistory = async () => {
    try {
      const res = await axios.get(`${serverURL}/organizer/escrow-release-history`, { withCredentials: true });
      setEscrowReleaseHistory(res.data?.data || []);
    } catch (e) {
      console.error("Failed to fetch escrow release history:", e);
    }
  };

  const deletePayment = async (id) => {
    const ok = typeof window !== "undefined" ? window.confirm("Delete this payment record?") : true;
    if (!ok) return;
    try {
      await axios.delete(`${serverURL}/organizer/payment-history/${id}`, { withCredentials: true });
      setPayments((prev) => prev.filter((p) => p._id !== id));
      showToast("Payment record deleted", "success");
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to delete payment record", "error");
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchPayments();
    fetchEscrowReleaseHistory();
  }, []);

  const withdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    try {
      const amountNum = parseFloat(withdrawAmount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        showToast("Enter a valid amount", "error");
        return;
      }
      const prefill = {
        name: user?.name || "Organizer",
        email: user?.email || "",
        contact: user?.phone || "9999999999",
      };
      navigate("/razorpay", {
        state: {
          checkoutPurpose: "withdraw",
          amount: amountNum,
          mode: withdrawMode,
          beneficiary_name: withdrawName,
          ...(withdrawMode === "upi"
            ? { upi_id: withdrawUPI || wallet.upi_id }
            : { account_number: withdrawBankAccount, ifsc: withdrawIFSC }),
          prefill,
          returnPath: "/organizer/wallet",
        },
      });
    } catch (e) {
      showToast(e?.response?.data?.message || e.message || "Failed to start checkout", "error");
    }
  };

  // Handle return from Razorpay: show toast, update balance, record debit
  useEffect(() => {
    const st = location.state;
    if (!st) return;
    if (st.toast) {
      const { type, message } = st.toast;
      showToast(message, type || "info");
    }
    if (st.wallet?.visible && st.wallet?.balance !== undefined) {
      setWallet((w) => ({ ...w, balance: st.wallet.balance ?? w.balance }));
    }
    if (st.debitedAmount) {
      const amt = parseFloat(st.debitedAmount);
      if (Number.isFinite(amt) && amt > 0) {
        const entry = { amount: amt, date: new Date().toISOString() };
        const next = [entry, ...history];
        setHistory(next);
        localStorage.setItem("org_withdraw_history", JSON.stringify(next));
      }
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Wallet & Escrow" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-start md:gap-6">
          <div className="w-full md:w-2/5">
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-32 overflow-hidden">
                <img
                  src="/cards_images/wallet.png"
                  alt="wallet"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-600/30 to-pink-600/30" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">Wallet Balance</h3>
                {loading ? (
                  <div className="mt-2 animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
                ) : (
                  <p className="text-3xl font-extrabold mt-1">₹ {wallet.balance?.toFixed(2) || 0}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">UPI: {wallet.upi_id || "-"}</p>
                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Amount (INR)</label>
                      <input
                        type="number"
                        min={1}
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(parseFloat(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="e.g., 1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Destination</label>
                      <select
                        value={withdrawMode}
                        onChange={(e) => setWithdrawMode(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
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
                        className="w-full border rounded-lg px-3 py-2"
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
                          className="w-full border rounded-lg px-3 py-2"
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
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="0000 0000 0000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">IFSC</label>
                          <input
                            type="text"
                            value={withdrawIFSC}
                            onChange={(e) => setWithdrawIFSC(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="ABCD0123456"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button onClick={withdraw} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg">Confirm Withdraw</button>
                    <button onClick={fetchWallet} className="px-4 py-2 border rounded-lg">Refresh</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h4 className="text-lg font-bold mb-3">Withdraw History</h4>
              {history.length === 0 ? (
                <p className="text-gray-600">No debits yet.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {history.map((h, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                      <span className="font-semibold text-gray-900">₹ {h.amount}</span>
                      <span className="text-gray-500 text-xs">{new Date(h.date).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="w-full md:w-3/5 space-y-6 mt-6 md:mt-0">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold">Escrow Release History</h4>
                {escrowReleaseHistory.length > 3 && (
                  <button
                    onClick={() => setShowAllPayments(true)}
                    className="text-purple-600 hover:text-purple-800 font-semibold text-sm"
                  >
                    View All ({escrowReleaseHistory.length})
                  </button>
                )}
              </div>
              {escrowReleaseHistory.length === 0 ? (
                <p className="text-gray-600">No escrow releases yet.</p>
              ) : (
                <div className="space-y-3">
                  {escrowReleaseHistory.slice(0, 3).map((record) => {
                    const orgAmount = asNumber(record?.amount) ?? 0;
                    const totalAmount = asNumber(record?.total_amount) ?? 0;
                    const orgPercentage = asNumber(record?.organizer_percentage) ?? 0;
                    const gigsPercentage = asNumber(record?.gigs_percentage) ?? 0;
                    
                    return (
                      <div key={record._id} className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">
                              {(() => {
                                const ev = record?.event;
                                if (!ev) return "Event";
                                if (typeof ev === "object") return ev?.title || ev?._id || "Event";
                                return ev;
                              })()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Release Date: {record?.payment_date ? new Date(record.payment_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                            {record?.status || 'Released'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-green-200">
                          <div>
                            <p className="text-xs text-gray-600">Total Released</p>
                            <p className="text-base font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Your Share ({orgPercentage}%)</p>
                            <p className="text-lg font-semibold text-green-600">₹{orgAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Gigs Share ({gigsPercentage}%)</p>
                            <p className="text-base font-semibold text-gray-700">₹{(totalAmount * gigsPercentage / 100).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="text-lg font-bold mb-3">Escrow & Payment Status</h4>
              {payments.length === 0 ? (
                <p className="text-gray-600">No escrow records yet.</p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-auto">
                  {payments.map((p) => (
                    <div key={p._id} className="border rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          Event: {(() => {
                            const ev = p?.event;
                            if (!ev) return "-";
                            if (typeof ev === "object") return ev?.title || ev?._id || "-";
                            return ev;
                          })()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: ₹ {(() => {
                            const amt = asNumber(p?.total_amount ?? p?.amount);
                            return amt !== null ? amt.toFixed(2) : "-";
                          })()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Split: Org {(() => {
                            const org = asNumber(p?.organizer_percentage);
                            return org !== null ? org : "-";
                          })()}% · Gigs {(() => {
                            const gigs = asNumber(p?.gigs_percentage);
                            return gigs !== null ? gigs : "-";
                          })()}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs ${p?.status === 'released' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p?.status || 'pending'}</span>
                        <button
                          onClick={() => deletePayment(p._id)}
                          className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          aria-label="Delete payment record"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View All Payments Modal */}
        {showAllPayments && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800">All Payment History</h2>
                <button
                  onClick={() => setShowAllPayments(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div className="space-y-4">
                  {escrowReleaseHistory.map((record) => {
                    const orgAmount = asNumber(record?.amount) ?? 0;
                    const totalAmount = asNumber(record?.total_amount) ?? 0;
                    const orgPercentage = asNumber(record?.organizer_percentage) ?? 0;
                    const gigsPercentage = asNumber(record?.gigs_percentage) ?? 0;
                    
                    return (
                      <div key={record._id} className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">
                              {(() => {
                                const ev = record?.event;
                                if (!ev) return "Event";
                                if (typeof ev === "object") return ev?.title || ev?._id || "Event";
                                return ev;
                              })()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Release Date: {record?.payment_date ? new Date(record.payment_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                            {record?.status || 'Released'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-green-200">
                          <div>
                            <p className="text-xs text-gray-600">Total Released</p>
                            <p className="text-base font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Your Share ({orgPercentage}%)</p>
                            <p className="text-lg font-semibold text-green-600">₹{orgAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Gigs Share ({gigsPercentage}%)</p>
                            <p className="text-base font-semibold text-gray-700">₹{(totalAmount * gigsPercentage / 100).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-green-100">
                          <div>
                            <p className="text-xs text-gray-600">Payment Method</p>
                            <p className="text-sm font-semibold text-gray-900 uppercase">{record?.payment_method || 'UPI'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Transaction ID</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{record?.transaction_id || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrganizerWallet;
