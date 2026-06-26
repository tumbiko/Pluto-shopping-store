"use client";

import useStore from "@/store";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Home, Package, ShoppingBag, Clock } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// ---- Proper types for PayChangu Verify Response ----

type MobileMoneyInfo = {
  name?: string;
};

export type PayChanguTransaction = {
  charge_id?: string;
  ref_id?: string;
  amount?: string | number;
  mobile?: string;
  mobile_money?: MobileMoneyInfo;
};

type VerifyResponse = {
  ok: boolean;
  status?: string;
  data?: PayChanguTransaction | null;
};

const MAX_POLLS = 12;       // Poll up to 12 times
const POLL_INTERVAL_MS = 5000; // Every 5 seconds = up to 60 seconds total

const SuccessPageContent = () => {
  const { resetCart } = useStore();
  const searchParams = useSearchParams();
  const chargeId = searchParams.get("ref");

  const [transactionData, setTransactionData] =
    useState<PayChanguTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<"polling" | "paid" | "timeout">("polling");

  const pollCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset cart once
  useEffect(() => {
    if (chargeId) resetCart();
  }, [chargeId, resetCart]);

  // Poll verify endpoint until payment confirmed or timeout
  useEffect(() => {
    if (!chargeId) {
      setLoading(false);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/paychangu/verify?charge_id=${chargeId}`);
        const data: VerifyResponse = await res.json();
        console.log(`📤 Poll #${pollCountRef.current + 1} — status:`, data.status, data);

        const isPaid =
          data.status === "success" ||
          data.status === "successful" ||
          data.status === "verified";

        if (isPaid) {
          // ✅ Payment confirmed
          setTransactionData(data.data ?? null);
          setPaymentStatus("paid");
          setLoading(false);
          return; // Stop polling
        }

        pollCountRef.current += 1;
        setPollCount(pollCountRef.current);

        if (pollCountRef.current >= MAX_POLLS) {
          // Timed out — show what we have
          setTransactionData(data.data ?? null);
          setPaymentStatus("timeout");
          setLoading(false);
          return;
        }

        // Schedule next poll
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        console.error("Error polling payment status:", err);
        pollCountRef.current += 1;
        if (pollCountRef.current < MAX_POLLS) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          setLoading(false);
          setPaymentStatus("timeout");
        }
      }
    };

    // Start first poll after a short delay (give PayChangu time to process)
    timerRef.current = setTimeout(poll, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [chargeId]);

  if (loading) {
    const secondsElapsed = pollCount * (POLL_INTERVAL_MS / 1000);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 gap-6 px-4">
        <Loader2 className="w-16 h-16 text-yellow-400 animate-spin" />
        <div className="text-center">
          <p className="text-white text-xl font-semibold mb-2">Confirming your payment...</p>
          <p className="text-gray-400 text-sm">
            {pollCount === 0
              ? "Waiting for PayChangu to process your mobile money payment..."
              : `Still checking... (${secondsElapsed}s elapsed)`}
          </p>
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: MAX_POLLS }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < pollCount ? "bg-yellow-400" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-5 bg-gray-900 flex items-center justify-center mx-4 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 rounded-2xl flex flex-col gap-8 shadow-2xl p-6 max-w-xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${
            paymentStatus === "timeout" ? "bg-yellow-500" : "bg-green-500"
          }`}
        >
          {paymentStatus === "timeout" ? (
            <Clock className="text-white w-10 h-10" />
          ) : (
            <Check className="text-white w-10 h-10" />
          )}
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-4">
          {paymentStatus === "timeout"
            ? "Payment Processing..."
            : "Payment Successful!"}
        </h1>

        {paymentStatus === "timeout" && (
          <p className="text-yellow-300 text-sm bg-yellow-900/30 rounded-lg px-4 py-3 -mt-4">
            Your payment was submitted. Mobile money payments can take a minute to confirm.
            Check your Orders page in a moment — it will update automatically once confirmed.
          </p>
        )}

        {/* Details */}
        <div className="space-y-4 mb-4 text-left text-gray-300">
          <p>
            Thank you for your purchase. We&apos;re processing your order and
            will ship it soon.
          </p>

          <p>
            Order Number:{" "}
            <span className="text-white font-semibold">
              {transactionData?.charge_id ?? chargeId ?? "N/A"}
            </span>
          </p>

          <p>
            Transaction ID:{" "}
            <span className="text-white font-semibold">
              {transactionData?.ref_id ?? "N/A"}
            </span>
          </p>

          <p>
            Amount:{" "}
            <span className="text-white font-semibold">
              {transactionData?.amount ?? "N/A"}
            </span>
          </p>

          <p>
            Phone:{" "}
            <span className="text-white font-semibold">
              {transactionData?.mobile ?? "N/A"}
            </span>
          </p>

          <p>
            Operator:{" "}
            <span className="text-white font-semibold">
              {transactionData?.mobile_money?.name ?? "N/A"}
            </span>
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/"
            className="flex items-center justify-center px-4 py-3 font-semibold bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 shadow-md"
          >
            <Home className="w-5 h-5 mr-2" /> Home
          </Link>

          <Link
            href="/trackdelivery"
            className="flex items-center justify-center px-4 py-3 font-semibold bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all duration-300 shadow-md"
          >
            <Package className="w-5 h-5 mr-2" /> Orders
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center px-4 py-3 font-semibold bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 shadow-md"
          >
            <ShoppingBag className="w-5 h-5 mr-2" /> Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const SuccessPage = () => (
  <Suspense
    fallback={
      <div className="text-white text-center mt-10">Loading...</div>
    }
  >
    <SuccessPageContent />
  </Suspense>
);

export default SuccessPage;
