import React, { useEffect } from "react";
import axios from "axios";
import { serverURL } from "../App.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Razorpay() {
  const navigate = useNavigate();
  const location = useLocation();
  const flow = location.state || {};
  const { user } = useAuth();

  const role = user?.role || (flow?.returnPath?.startsWith("/organizer")
    ? "organizer"
    : flow?.returnPath?.startsWith("/gig")
    ? "gig"
    : "host");

  const withdrawPathMap = {
    host: "/host/wallet/withdraw",
    organizer: "/organizer/withdraw",
    gig: "/gigs/withdraw",
  };
  const defaultReturnPathMap = {
    host: "/host/profile",
    organizer: "/organizer/profile",
    gig: "/gig/profile",
  };
  const withdrawEndpoint = withdrawPathMap[role] || "/host/wallet/withdraw";
  const defaultReturnPath = defaultReturnPathMap[role] || "/host/profile";

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      // Step 0: Ensure Razorpay script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        // In demo mode, if SDK fails to load, proceed with withdraw success fallback
        if (flow?.checkoutPurpose === "withdraw") {
          const payload = {
            amount: flow.amount,
            mode: flow.mode,
            beneficiary_name: flow.beneficiary_name,
            ...(flow.mode === "upi"
              ? { upi_id: flow.upi_id }
              : { account_number: flow.account_number, ifsc: flow.ifsc }),
          };
          try {
            const wres = await axios.post(`${serverURL}${withdrawEndpoint}`, payload, { withCredentials: true });
            const wdata = wres.data?.data || wres.data;
            const newBalance =
              wdata?.new_balance ?? (wdata?.balance_inr ? parseFloat(wdata.balance_inr.toString?.() || wdata.balance_inr) : null);
            navigate(flow.returnPath || defaultReturnPath, {
              state: {
                toast: {
                  type: "success",
                  title: "Payment successful",
                  message: `₹ ${parseFloat(flow.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} withdrawn`,
                },
                wallet: { visible: true, balance: newBalance },
                debitedAmount: flow.amount,
              },
            });
          } catch (e) {
            navigate(flow.returnPath || defaultReturnPath, {
              state: {
                toast: { type: "error", title: "Payment failed", message: "Could not complete withdrawal in demo mode." },
              },
            });
          }
        }
        return;
      }

      // Step 1: Create order on the server
      const amountPaise = flow?.amount ? Math.round(parseFloat(flow.amount) * 100) : 50000; // default 500.00 INR if not provided
      const orderResponse = await axios.post(`${serverURL}/payments/create`, {
        amount: amountPaise,
        currency: "INR",
      });

      const { amount, id: order_id, currency } = orderResponse.data.data;

      // Step 2: Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount,
        currency,
        name: "Event Flex",
        description: flow?.checkoutPurpose === "withdraw" ? "Withdraw Confirmation (Test)" : "Event Transaction",
        order_id,
        handler: async function (response) {
          try {
            // For demo withdraw flow, skip strict verification and proceed
            if (flow?.checkoutPurpose === "withdraw") {
              const payload = {
                amount: flow.amount,
                mode: flow.mode,
                beneficiary_name: flow.beneficiary_name,
                ...(flow.mode === "upi"
                  ? { upi_id: flow.upi_id }
                  : { account_number: flow.account_number, ifsc: flow.ifsc }),
              };
              const wres = await axios.post(`${serverURL}${withdrawEndpoint}`, payload, { withCredentials: true });
              const wdata = wres.data?.data || wres.data;
              const newBalance =
                wdata?.new_balance ?? (wdata?.balance_inr ? parseFloat(wdata.balance_inr.toString?.() || wdata.balance_inr) : null);
              navigate(flow.returnPath || defaultReturnPath, {
                state: {
                  toast: {
                    type: "success",
                    title: "Payment successful",
                    message: `₹ ${parseFloat(flow.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} withdrawn`,
                  },
                  wallet: {
                    visible: true,
                    balance: newBalance,
                  },
                  debitedAmount: flow.amount,
                },
              });
              return;
            } else if (flow?.checkoutPurpose === "add_money") {
              // Add Money to Wallet Flow
              const res = await axios.post(`${serverURL}/host/wallet/add`, {
                amount: flow.amount,
                transaction_id: `pay_${Date.now()}`, // Simulated Razorpay ID
                payment_method: "upi"
              }, { withCredentials: true });
              
              const newBalance = res.data?.data?.new_balance;
              
              navigate(flow.returnPath || defaultReturnPath, {
                state: {
                  toast: {
                    type: "success",
                    title: "Money Added",
                    message: `₹ ${parseFloat(flow.amount).toFixed(2)} added to wallet successfully`,
                  },
                  wallet: {
                    visible: true,
                    balance: newBalance,
                  },
                },
              });
              return;
            } else {
              if (flow?.checkoutPurpose === "deposit_escrow") {
                try {
                  await axios.post(`${serverURL}/host/payment/deposit`, {
                    eventId: flow.eventId,
                    organizerId: flow.organizerId,
                    total_amount: flow.amount,
                    organizer_percentage: flow.organizer_percentage ?? 40,
                    gigs_percentage: flow.gigs_percentage ?? 60,
                    payment_method: flow.payment_method || "upi",
                    upi_transaction_id: response.razorpay_payment_id,
                  }, { withCredentials: true });
                  navigate(flow.returnPath || "/host/payments", {
                    state: {
                      toast: {
                        type: "success",
                        title: "Escrow funded",
                        message: "Deposit completed",
                      },
                    },
                  });
                } catch {
                  navigate(flow.returnPath || "/host/payments", {
                    state: {
                      toast: { type: "error", title: "Deposit failed", message: "Could not fund escrow" },
                    },
                  });
                }
              } else {
                try {
                  await axios.post(`${serverURL}/payments/verify`, {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                } catch {}
                navigate("/");
              }
            }
          } catch (verifyError) {
            console.error("Payment or withdraw error:", verifyError);
            // Redirect back with error toast (no window alert)
            navigate(flow.returnPath || defaultReturnPath, {
              state: {
                toast: {
                  type: "error",
                  title: "Payment failed",
                  message: "Could not complete withdrawal in demo mode.",
                },
              },
            });
          }
        },
        modal: {
          ondismiss: function () {
            // User closed the Razorpay modal — return to profile quietly
            navigate(flow.returnPath || defaultReturnPath, {
              state: {
                toast: {
                  type: "error",
                  title: "Payment cancelled",
                  message: "Checkout was closed before completion.",
                },
              },
            });
          },
        },
        prefill: {
          name: flow?.prefill?.name || "Event Flex User",
          email: flow?.prefill?.email || "team.aditya.invincible@gmail.com",
          contact: flow?.prefill?.contact || "9999999999",
        },
        theme: {
          color: "#F37254",
        },
      };

      // Step 4: Open Razorpay checkout
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error("Error during payment:", error);
      // In demo mode, fall back to a success path without alerts
      if (flow?.checkoutPurpose === "withdraw") {
        try {
          const payload = {
            amount: flow.amount,
            mode: flow.mode,
            beneficiary_name: flow.beneficiary_name,
            ...(flow.mode === "upi"
              ? { upi_id: flow.upi_id }
              : { account_number: flow.account_number, ifsc: flow.ifsc }),
          };
          const wres = await axios.post(`${serverURL}${withdrawEndpoint}`, payload, { withCredentials: true });
          const wdata = wres.data?.data || wres.data;
          const newBalance =
            wdata?.new_balance ?? (wdata?.balance_inr ? parseFloat(wdata.balance_inr.toString?.() || wdata.balance_inr) : null);
          navigate(flow.returnPath || defaultReturnPath, {
            state: {
              toast: {
                type: "success",
                title: "Payment successful",
                message: `₹ ${parseFloat(flow.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} withdrawn`,
              },
              wallet: { visible: true, balance: newBalance },
              debitedAmount: flow.amount,
            },
          });
          } catch (e) {
            navigate(flow.returnPath || defaultReturnPath, {
              state: {
                toast: { type: "error", title: "Payment failed", message: "Could not complete withdrawal in demo mode." },
              },
            });
          }
        } else {
          if (flow?.checkoutPurpose === "deposit_escrow") {
            try {
              await axios.post(`${serverURL}/host/payment/deposit`, {
                eventId: flow.eventId,
              organizerId: flow.organizerId,
              total_amount: flow.amount,
              organizer_percentage: flow.organizer_percentage ?? 40,
              gigs_percentage: flow.gigs_percentage ?? 60,
              payment_method: flow.payment_method || "upi",
              upi_transaction_id: "demo",
            }, { withCredentials: true });
            navigate(flow.returnPath || "/host/payments", {
              state: {
                toast: { type: "success", title: "Escrow funded", message: "Deposit completed" },
              },
            });
          } catch {
            navigate(flow.returnPath || "/host/payments", {
              state: {
                toast: { type: "error", title: "Deposit failed", message: "Could not fund escrow" },
              },
            });
          }
        } else {
          navigate("/", {
            state: {
              toast: { type: "error", title: "Payment failed", message: "Demo payment could not be completed." },
            },
          });
        }
      }
    }
  };

  useEffect(() => {
    // Auto-open checkout if navigated here for withdrawal, add_money, or deposit_escrow
    if (
      flow?.checkoutPurpose === "withdraw" ||
      flow?.checkoutPurpose === "add_money" ||
      flow?.checkoutPurpose === "deposit_escrow"
    ) {
      handlePayment();
    }
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="p-6 border rounded-xl bg-white shadow-sm max-w-md w-full text-center">
        <h2 className="text-lg font-semibold">Razorpay Checkout (Test)</h2>
        <p className="text-sm text-gray-600 mt-1">Purpose: {flow?.checkoutPurpose || "payment"}</p>
        {flow?.amount && (
          <p className="text-sm text-gray-700 mt-1">Amount: ₹ {parseFloat(flow.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        )}
        <button
          onClick={handlePayment}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          Pay with Razorpay
        </button>
        <p className="text-xs text-gray-500 mt-3">Test mode only • No real charges</p>
      </div>
    </div>
  );
}

export default Razorpay;
