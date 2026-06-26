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
      <div className="flex items-center justify-center min-h-[85vh] bg-gray-50 dark:bg-[#121212] transition-colors duration-300 px-4">
        <div className="flex flex-col items-center justify-center bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-3xl gap-6 p-8 max-w-md w-full text-center shadow-md transition-all duration-300">
          <Loader2 className="w-16 h-16 text-shop-dark-yellow dark:text-shop-golden animate-spin" />
          <div className="text-center">
            <p className="text-gray-900 dark:text-white text-xl font-bold mb-2">Confirming your payment...</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto">
              {pollCount === 0
                ? "Waiting for PayChangu to process your mobile money payment..."
                : `Still checking... (${secondsElapsed}s elapsed)`}
            </p>
            <div className="flex justify-center gap-1.5 mt-5">
              {Array.from({ length: MAX_POLLS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i < pollCount 
                      ? "bg-shop-dark-yellow dark:bg-shop-golden scale-110" 
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 bg-gray-50 dark:bg-[#121212] flex items-center justify-center min-h-[85vh] transition-colors duration-300 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col gap-8 shadow-md hover:shadow-lg transition-all duration-300 p-8 max-w-xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border transition-colors duration-300 ${
            paymentStatus === "timeout"
              ? "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30"
              : "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30"
          }`}
        >
          {paymentStatus === "timeout" ? (
            <Clock className="w-10 h-10" />
          ) : (
            <Check className="w-10 h-10" />
          )}
        </motion.div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
            {paymentStatus === "timeout"
              ? "Payment Processing..."
              : "Payment Successful!"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {paymentStatus === "timeout" 
              ? "Your payment is currently being processed." 
              : "Thank you for your purchase!"}
          </p>
        </div>

        {paymentStatus === "timeout" && (
          <p className="text-yellow-700 dark:text-yellow-300 text-sm bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/20 rounded-xl px-4 py-3.5 -mt-4 text-left leading-relaxed">
            Your payment was submitted. Mobile money payments can take a minute to confirm.
            Check your Orders page in a moment — it will update automatically once confirmed.
          </p>
        )}

        {/* Details Card */}
        <div className="bg-gray-50 dark:bg-[#121212]/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800/80 space-y-4 text-left transition-colors duration-300">
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-b border-gray-200/60 dark:border-gray-800 pb-3 mb-3">
            We&apos;re processing your order and will ship it soon.
          </p>

          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Order Number:</span>
            <span className="text-gray-900 dark:text-white font-semibold text-right break-all">
              {transactionData?.charge_id ?? chargeId ?? "N/A"}
            </span>

            <span className="text-gray-500 dark:text-gray-400 font-medium">Transaction ID:</span>
            <span className="text-gray-900 dark:text-white font-semibold text-right break-all">
              {transactionData?.ref_id ?? "N/A"}
            </span>

            <span className="text-gray-500 dark:text-gray-400 font-medium">Amount:</span>
            <span className="text-gray-900 dark:text-white font-bold text-right text-shop-dark-yellow dark:text-shop-golden">
              {transactionData?.amount ?? "N/A"}
            </span>

            <span className="text-gray-500 dark:text-gray-400 font-medium">Phone:</span>
            <span className="text-gray-900 dark:text-white font-semibold text-right">
              {transactionData?.mobile ?? "N/A"}
            </span>

            <span className="text-gray-500 dark:text-gray-400 font-medium">Operator:</span>
            <span className="text-gray-900 dark:text-white font-semibold text-right">
              {transactionData?.mobile_money?.name ?? "N/A"}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <Link
            href="/"
            className="flex items-center justify-center px-4 py-3 font-semibold rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all duration-300 shadow-sm text-sm"
          >
            <Home className="w-4 h-4 mr-2" /> Home
          </Link>

          <Link
            href="/trackdelivery"
            className="flex items-center justify-center px-4 py-3 font-semibold bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all duration-300 shadow-md text-sm dark:bg-green-600 dark:hover:bg-green-500"
          >
            <Package className="w-4 h-4 mr-2" /> Orders
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center px-4 py-3 font-semibold rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all duration-300 shadow-sm text-sm"
          >
            <ShoppingBag className="w-4 h-4 mr-2" /> Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const SuccessPage = () => (
  <Suspense
    fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 dark:bg-[#121212] transition-colors duration-300">
        <Loader2 className="w-10 h-10 text-shop-dark-yellow dark:text-shop-golden animate-spin" />
        <div className="text-gray-900 dark:text-white text-center mt-4 font-semibold">Loading...</div>
      </div>
    }
  >
    <SuccessPageContent />
  </Suspense>
);

export default SuccessPage;
