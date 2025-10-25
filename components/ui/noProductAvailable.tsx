"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const NoProductAvailable = ({
  selectedTab,
  className,
}: {
  selectedTab?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-10 min-h-80 space-y-4 bg-gray-100 rounded-lg w-full mt-10 text-center",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <h2 className="text-2xl font-bold text-gray-800">No Product Available</h2>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
        className="text-gray-600"
      >
        We are sorry, but there are currently no products available in the{" "}
        <span className="font-semibold text-shop-dark-yellow">{selectedTab}</span> category.
        Please check back later or explore other categories for exciting products!
      </motion.p>

      {/* Zooming text — apply transform-gpu and font smoothing */}
      <motion.div
        className="flex items-center space-x-2 text-gray-500 transform-gpu p-2"
        animate={{}}
      >
        <Loader2 className="w-5 h-5 animate-spin" />

        {/* Animate only the text for a smooth zoom-in/out look */}
        <motion.span
          style={{
            transformOrigin: "center",
            willChange: "transform",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
          className="antialiased origin-center"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{
            repeat: Infinity,
            duration: 1.6,
            ease: "easeInOut",
            repeatType: "loop",
          }}
        >
          We are working to add new products soon...
        </motion.span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
        className="text-gray-600"
      >
        Please check back later or explore other product categories
      </motion.p>
    </div>
  );
};

export default NoProductAvailable;
