"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { emptyStuff } from "@/images";
import Image from "next/image";

export default function EmptyCart() {
  return (
    <div className="py-10 md:py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut",
          }}
          className="relative w-48 h-48 mx-auto"
        >
          <Image
            src={emptyStuff}
            alt="Empty shopping cart"
            fill
            style={{ objectFit: "contain" }}
            className="drop-shadow-lg"
          />
          <motion.div
            animate={{
              x: [0, -10, 10, 0],
              y: [0, -5, 5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "linear",
            }}
            className="absolute -top-4 -right-4 bg-blue-500 rounded-full p-2"
          >
            <ShoppingCart size={24} className="text-white" />
          </motion.div>
        </motion.div>

        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            Your cart is feeling lonely
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            It looks like you haven&apos;t added anything to your cart yet.
            Let&apos;s change that and find some amazing products for you!
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="block bg-black/5 dark:bg-white/10 border border-black/20 dark:border-white/20 text-center py-2.5 rounded-full text-sm font-semibold tracking-wide hover:border-black hover:bg-black hover:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            Discover Products
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
