import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { serverURL } from "../../App.jsx";
import TopNavbar from "../../components/TopNavbar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

function GigWallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [wallet, setWallet] = useState({ balance: 0, upi_id: "" });
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [payments, setPayments] = useState([]);
  const [escrowPayments, setEscrowPayments] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);

  const [withdrawMode, setWithdrawMode] = useState("upi");
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawUPI, setWithdrawUPI] = useState("");
  const [withdrawBankAccount, setWithdrawBankAccount] = useState("");
  const [withdrawIFSC, setWithdrawIFSC] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("gig_withdraw_info");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.withdrawName) setWithdrawName(parsed.withdrawName);
        if (parsed.withdrawUPI) setWithdrawUPI(parsed.withdrawUPI);
        if (parsed.withdrawBankAccount) setWithdrawBankAccount(parsed.withdrawBankAccount);
        if (parsed.withdrawIFSC) setWithdrawIFSC(parsed.withdrawIFSC);
        if (parsed.withdrawMode) setWithdrawMode(parsed.withdrawMode);
      } catch (e) {}
    }

    const savedHistory = localStorage.getItem("gig_withdraw_history");
    if (savedHistory) {
      try {
        setWithdrawHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const info = { withdrawName, withdrawUPI, withdrawBankAccount, withdrawIFSC, withdrawMode };
    localStorage.setItem("gig_withdraw_info", JSON.stringify(info));
  }, [withdrawName, withdrawUPI, withdrawBankAccount, withdrawIFSC, withdrawMode]);

  useEffect(() => {
    if (wallet?.upi_id && !withdrawUPI) setWithdrawUPI(wallet.upi_id);
  }, [wallet?.upi_id]);

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
      const res = await axios.get(`${serverURL}/gigs/wallet`, { withCredentials: true });
      const rawBal = res.data?.data?.balance_inr ?? res.data?.data?.balance;
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
      const res = await axios.get(`${serverURL}/gigs/payment-history`, { withCredentials: true });
      const items = res.data?.data || [];
      setPayments(items);
    } catch (e) {}
  };

  const fetchEscrows = async () => {
    try {
      const res = await axios.get(`${serverURL}/gigs/escrows`, { withCredentials: true });
      const list = (res.data?.data || []).map((e) => ({
        _id: e._id,
        event: e.event,
        total_amount: e.total_amount,
        status: e.status,
      }));
      setEscrowPayments(list);
    } catch (e) {}
  };

  useEffect(() => {
    fetchWallet();
    fetchPayments();
    fetchEscrows();
  }, []);

  const withdraw = () => {
    const amountNum = parseFloat(withdrawAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    const prefill = {
      name: user?.fullName || user?.name || "Gig",
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
        returnPath: "/gig/wallet",
      },
    });
  };

  useEffect(() => {
    const st = location.state;
    if (!st) return;
    if (st.toast) showToast(st.toast.message, st.toast.type || "info");
    if (st.wallet?.visible && st.wallet?.balance !== undefined) {
      setWallet((w) => ({ ...w, balance: st.wallet.balance ?? w.balance }));
    }
    if (st.debitedAmount) {
      const newEntry = {
        amount: parseFloat(st.debitedAmount),
        date: new Date().toISOString(),
      };
      setWithdrawHistory((prev) => {
        const updated = [newEntry, ...prev];
        localStorage.setItem("gig_withdraw_history", JSON.stringify(updated));
        return updated;
      });
      navigate(location.pathname, { replace: true, state: { ...st, debitedAmount: undefined } });
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TopNavbar title="Gig Wallet" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-start md:gap-6">
          <div className="w-full md:w-2/5">
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-32 overflow-hidden">
                <img src="/cards_images/wallet.png" alt="wallet" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                      <input type="number" min={1} step="0.01" value={withdrawAmount} onChange={(e) => setWithdrawAmount(parseFloat(e.target.value))} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., 1000" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Destination</label>
                      <select value={withdrawMode} onChange={(e) => setWithdrawMode(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                        <option value="upi">UPI</option>
                        <option value="bank">Bank</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Beneficiary Name</label>
                      <input type="text" value={withdrawName} onChange={(e) => setWithdrawName(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Recipient name" />
                    </div>
                    {withdrawMode === "upi" ? (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">UPI ID</label>
                        <input type="text" value={withdrawUPI} onChange={(e) => setWithdrawUPI(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="example@bank" />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Account Number</label>
                          <input type="text" value={withdrawBankAccount} onChange={(e) => setWithdrawBankAccount(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="0000 0000 0000" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">IFSC</label>
                          <input type="text" value={withdrawIFSC} onChange={(e) => setWithdrawIFSC(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="ABCD0123456" />
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
          </div>
          <div className="w-full md:w-3/5 space-y-6 mt-6 md:mt-0">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="text-lg font-bold mb-3">Escrow Payments</h4>
              {escrowPayments.length === 0 ? (
                <p className="text-gray-600">No escrow payments yet.</p>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-auto">
                  {escrowPayments.map((p) => (
                    <div key={p._id} className="border rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Event: {typeof p.event === "object" ? p.event?.title || "-" : p.event || "-"}</p>
                        <p className="text-sm text-gray-600">Total: ₹ {((typeof p.total_amount === "object" && p.total_amount?.$numberDecimal) ? parseFloat(p.total_amount.$numberDecimal) : typeof p.total_amount === "number" ? p.total_amount : parseFloat(p.total_amount || 0)).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Status: {p.status || 'pending'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs ${p.status === 'released' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status || 'pending'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="text-lg font-bold mb-3">Payment History</h4>
              {payments.length === 0 ? (
                <p className="text-gray-600">No payments received yet.</p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-auto">
                  {payments.map((p) => {
                    const gigAmount = asNumber(p?.amount) ?? 0;
                    const eventTitle = (() => {
                      const ev = p?.event;
                      if (!ev) return "Event";
                      if (typeof ev === "object") return ev?.title || "Event";
                      return ev;
                    })();
                    
                    return (
                      <div key={p._id} className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{eventTitle}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Payment Date: {p?.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                            {p?.status || 'Completed'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-green-200">
                          <div>
                            <p className="text-xs text-gray-600">Your Share</p>
                            <p className="text-lg font-semibold text-green-600">₹{gigAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Payment Method</p>
                            <p className="text-sm font-semibold text-gray-900 uppercase">{p?.payment_method || 'UPI'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Transaction ID</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{p?.transaction_id || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Status</p>
                            <p className="text-sm font-semibold text-green-700">✓ Added to Wallet</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="text-lg font-bold mb-3">Withdraw History</h4>
              {withdrawHistory.length === 0 ? (
                <p className="text-gray-600">No withdrawals yet.</p>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-auto">
                  {withdrawHistory.map((w, i) => (
                    <div key={i} className="border rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Withdrawal</p>
                        <p className="text-sm text-gray-600">{new Date(w.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">- ₹ {w.amount.toFixed(2)}</p>
                        <span className="text-xs text-green-600 font-semibold">Success</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default GigWallet;
