"use client";

import useStore from "@/store";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, Home, Package, ShoppingBag } from "lucide-react";
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
  data?: PayChanguTransaction | null;
};

const SuccessPageContent = () => {
  const { resetCart } = useStore();
  const searchParams = useSearchParams();
  const chargeId = searchParams.get("ref");

  const [transactionData, setTransactionData] =
    useState<PayChanguTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  // Reset cart if payment is successful
  useEffect(() => {
    if (chargeId) resetCart();
  }, [chargeId, resetCart]);

  // Fetch transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!chargeId) return;

      try {
        const res = await fetch(`/api/paychangu/verify?charge_id=${chargeId}`);
        const data: VerifyResponse = await res.json();
        console.log("📤 PayChangu transaction data:", data);

        setTransactionData(data.data ?? null);
      } catch (err) {
        console.error("Error fetching transaction data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [chargeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-16 h-16 text-white animate-spin" />
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
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <Check className="text-white w-10 h-10" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Payment Successful!
        </h1>

        {/* Details */}
        <div className="space-y-4 mb-4 text-left text-gray-300">
          <p>
            Thank you for your purchase. We&apos;re processing your order and
            will ship it soon.
          </p>

          <p>
            Order Number:{" "}
            <span className="text-white font-semibold">
              {transactionData?.charge_id ?? "N/A"}
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
            href="/orders"
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
