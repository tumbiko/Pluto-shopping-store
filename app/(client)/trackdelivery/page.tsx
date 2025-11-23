"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Search } from "lucide-react"; // ⬅ ChevronRight removed
import NoAccessToTrackDelivery from "@/components/ui/NoAccessToTrackDelivery";
import Container from "@/components/Container";
import Link from "next/link";

// Temporary Order type
type Order = Record<string, unknown>;

export default function TrackDeliveryPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { key: "all", label: "View all" },
    { key: "to_pay", label: "To pay (0)" },
    { key: "to_ship", label: "To ship (0)" },
    { key: "shipped", label: "Shipped (0)" },
    { key: "processed", label: "Processed (0)" },
  ];

  // Wait until Clerk finishes loading
  if (!isLoaded) return null;

  // If user is not signed in, show NoAccess message
  if (!isSignedIn) return <NoAccessToTrackDelivery />;

  // For now, assume no orders
  const orders: Order[] = [];

  return (
    <Container>
      <div className="w-full">
        {/* Tabs */}
        <div className="flex gap-4 border-b dark:border-gray-800 overflow-x-auto pb-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-2 px-3 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors ${
                activeTab === t.key
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-yellow-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-4 py-3 mt-6">
          <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Order ID, product or store name"
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white"
          />
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-semibold">
            Search
          </button>
        </div>

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="mt-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400 dark:text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No products to track yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven’t added any orders to track. Start shopping to see your orders here.
            </p>

            <Link
              href="/"
              className="p-2.5 block bg-black/5 dark:bg-white/10 border 
            border-black/20 dark:border-white/20 text-center rounded-full 
            text-sm font-semibold tracking-wide hover:border-black hover:bg-black 
            hover:text-white dark:hover:border-white dark:hover:bg-white 
            dark:hover:text-black transition-colors"
            >
              Discover Products
            </Link>
          </div>
        )}
      </div>
    </Container>
  );
}
