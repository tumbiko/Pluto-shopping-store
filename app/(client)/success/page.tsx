"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, X, Home, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import useStore from "@/store";

const SuccessPage = () => {
  const { resetCart } = useStore();
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);

  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Get search params on client
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const order = params.get("orderNumber");
    const tx_ref = params.get("tx_ref");
    const tId = params.get("transaction_id");

    setOrderNumber(order);
    setTxRef(tx_ref);
    setTransactionId(tId);

    if (order) resetCart();

    if (tx_ref || order) {
      const verifyPayment = async () => {
        try {
          const res = await fetch(`/api/paychangu/verify?tx_ref=${tx_ref || order}`);
          const data = await res.json();
          if (data.status === "success" || data.payment_status === "successful") {
            setVerified(true);
          }
        } catch (err) {
          console.error("Verification failed:", err);
        } finally {
          setVerifying(false);
        }
      };
      verifyPayment();
    } else {
      setVerifying(false);
    }
  }, [resetCart]);

  const isSuccess = verified;

  return (
    <div className="py-5 bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl flex flex-col gap-8 shadow-2xl p-6 max-w-xl w-full text-center"
      >
        {verifying ? (
          <p className="text-gray-700">Verifying payment...</p>
        ) : (
          <>
            <div
              className={`w-20 h-20 ${
                isSuccess ? "bg-black" : "bg-red-600"
              } rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
            >
              {isSuccess ? <Check className="text-white w-10 h-10" /> : <X className="text-white w-10 h-10" />}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {isSuccess ? "Payment Successful!" : "Payment Failed"}
            </h1>

            <div className="space-y-4 mb-4 text-left">
              <p className="text-gray-700">
                {isSuccess
                  ? "Thank you for your purchase. We're processing your order and will ship it soon."
                  : "Something went wrong. If payment was deducted, please contact support."}
              </p>
              <p className="text-gray-700">
                Order Number: <span className="text-black font-semibold">{orderNumber || txRef}</span>
              </p>
              {transactionId && (
                <p className="text-gray-700">
                  Transaction ID: <span className="text-black font-semibold">{transactionId}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/" className="flex items-center justify-center px-4 py-3 font-semibold bg-black text-white rounded-lg">
                <Home className="w-5 h-5 mr-2" />
                Home
              </Link>
              <Link href="/orders" className="flex items-center justify-center px-4 py-3 font-semibold bg-lightGreen text-black border border-lightGreen rounded-lg">
                <Package className="w-5 h-5 mr-2" />
                Orders
              </Link>
              <Link href="/" className="flex items-center justify-center px-4 py-3 font-semibold bg-black text-white rounded-lg">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Shop
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SuccessPage;
