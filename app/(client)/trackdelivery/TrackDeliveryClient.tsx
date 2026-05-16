"use client";

import React, { useState, useMemo } from "react";
import { Search, Package, Clock, Truck, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import PriceFormatter from "@/components/ui/PriceFormatter";
import { MyOrder } from "@/Actions/getMyOrders";

interface TrackDeliveryClientProps {
  orders: MyOrder[];
}

export default function TrackDeliveryClient({ orders }: TrackDeliveryClientProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to map tab key to allowed Sanity statuses
  const getStatusesForTab = (tab: string): string[] | null => {
    switch (tab) {
      case "all": return null;
      case "to_pay": return ["pending"];
      case "to_ship": return ["paid", "processing"];
      case "shipped": return ["shipped", "out_for_delivery"];
      case "processed": return ["delivered"];
      default: return null;
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter by Search Query
      const matchesSearch =
        searchQuery === "" ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.products?.some((item) =>
          item.product?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

      if (!matchesSearch) return false;

      // Filter by Tab
      const allowedStatuses = getStatusesForTab(activeTab);
      if (allowedStatuses && !allowedStatuses.includes(order.status || "")) {
        return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Count orders per tab
  const getTabCount = (tab: string) => {
    const statuses = getStatusesForTab(tab);
    if (!statuses) return orders.length;
    return orders.filter((o) => statuses.includes(o.status || "")).length;
  };

  const tabs = [
    { key: "all", label: `View all` },
    { key: "to_pay", label: `To pay (${getTabCount("to_pay")})` },
    { key: "to_ship", label: `To ship (${getTabCount("to_ship")})` },
    { key: "shipped", label: `Shipped (${getTabCount("shipped")})` },
    { key: "processed", label: `Processed (${getTabCount("processed")})` },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-orange-500 bg-orange-50 dark:bg-orange-900/20";
      case "paid": case "processing": return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "shipped": case "out_for_delivery": return "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20";
      case "delivered": return "text-green-500 bg-green-50 dark:bg-green-900/20";
      case "cancelled": return "text-red-500 bg-red-50 dark:bg-red-900/20";
      default: return "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <AlertCircle className="w-4 h-4 mr-1.5" />;
      case "paid": case "processing": return <Clock className="w-4 h-4 mr-1.5" />;
      case "shipped": case "out_for_delivery": return <Truck className="w-4 h-4 mr-1.5" />;
      case "delivered": return <CheckCircle className="w-4 h-4 mr-1.5" />;
      default: return <Package className="w-4 h-4 mr-1.5" />;
    }
  };

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-4 border-b dark:border-gray-800 overflow-x-auto pb-3 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2 px-3 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === t.key
                ? "text-shop-dark-yellow dark:text-shop-golden border-b-2 border-shop-dark-yellow dark:border-shop-golden"
                : "text-gray-600 dark:text-gray-400 hover:text-shop-dark-yellow dark:hover:text-shop-golden"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 mt-6 shadow-sm transition-colors duration-300">
        <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <input
          type="text"
          placeholder="Order ID, product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
        />
      </div>

      {/* Orders List */}
      <div className="mt-8 space-y-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order._id} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-sm transition-colors duration-300">
              {/* Order Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Order ID</span>
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{order.orderNumber}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Placed on {new Date(order.orderDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold capitalize ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status?.replace(/_/g, ' ')}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                {order.products?.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={urlFor(item.product.images[0]).url()}
                          alt={item.product.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {item.product?.name || "Unknown Product"}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        Qty: {item.quantity}
                      </p>
                      <div className="mt-1">
                        <PriceFormatter amount={item.product?.price * item.quantity} className="text-sm font-bold text-gray-900 dark:text-gray-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Order Total</span>
                <PriceFormatter amount={order.totalPrice} className="text-lg md:text-xl font-bold text-gray-900 dark:text-white" />
              </div>
            </div>
          ))
        ) : (
          <div className="mt-12 flex flex-col items-center justify-center text-center py-10 px-4 bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-gray-800">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full mb-6 flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No orders found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
              {searchQuery 
                ? "We couldn't find any orders matching your search. Try adjusting your filters." 
                : "You haven't placed any orders yet. Start shopping to see your orders here."}
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-shop-dark-yellow dark:bg-shop-golden text-black rounded-full text-sm font-bold tracking-wide hover:opacity-90 transition-opacity"
            >
              Discover Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
