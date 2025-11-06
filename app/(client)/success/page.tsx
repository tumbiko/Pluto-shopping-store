"use client";

import useStore from "@/store";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, X, Home, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";

const SuccessPageContent = () => {
  const { resetCart } = useStore();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const status = searchParams.get("status");
  const tx_ref = searchParams.get("tx_ref");
  const transactionId = searchParams.get("transaction_id");

  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      resetCart();
    }
  }, [orderNumber, resetCart]);

  // Optional: Verify payment with your backend (recommended)
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/paychangu/verify?tx_ref=${tx_ref || orderNumber}`);
        const data = await res.json();
        if (data?.status === "success" || data?.payment_status === "successful") {
          setVerified(true);
        }
      } catch (err) {
        console.error("Verification failed:", err);
      } finally {
        setVerifying(false);
      }
    };

    if (tx_ref || orderNumber) verifyPayment();
  }, [tx_ref, orderNumber]);

  const isSuccess =
    verified || status === "successful" || status === "success";

  return (
    <div className="py-5 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl flex flex-col gap-8 shadow-2xl p-6 max-w-xl w-full text-center"
      >
        {isSuccess ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <Check className="text-white w-10 h-10" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <X className="text-white w-10 h-10" />
          </motion.div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isSuccess ? "Payment Successful!" : "Payment Failed"}
        </h1>

        <div className="space-y-4 mb-4 text-left">
          {verifying ? (
            <p className="text-gray-700">Verifying payment...</p>
          ) : (
            <>
              <p className="text-gray-700">
                {isSuccess
                  ? "Thank you for your purchase. We're processing your order and will ship it soon."
                  : "Something went wrong. If payment was deducted, please contact support."}
              </p>
              <p className="text-gray-700">
                Order Number:{" "}
                <span className="text-black font-semibold">
                  {orderNumber || tx_ref}
                </span>
              </p>
              {transactionId && (
                <p className="text-gray-700">
                  Transaction ID:{" "}
                  <span className="text-black font-semibold">
                    {transactionId}
                  </span>
                </p>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/"
            className="flex items-center justify-center px-4 py-3 font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-md"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </Link>
          <Link
            href="/orders"
            className="flex items-center justify-center px-4 py-3 font-semibold bg-lightGreen text-black border border-lightGreen rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-md"
          >
            <Package className="w-5 h-5 mr-2" />
            Orders
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center px-4 py-3 font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-md"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const SuccessPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <SuccessPageContent />
  </Suspense>
);

export default SuccessPage;
