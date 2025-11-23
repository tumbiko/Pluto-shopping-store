"use client";

import React, { useCallback, useEffect, useState } from "react";
import Container from "@/components/Container";
import AddNewAddress from "@/components/ui/AddNewAddress";
import AddToWishList from "@/components/ui/AddToWishListButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyCart from "@/components/ui/EmptyCart";
import { Label } from "@/components/ui/label";
import NoAccessToCart from "@/components/ui/NoAccessToCart";
import PriceFormatter from "@/components/ui/PriceFormatter";
import QuantityButtons from "@/components/ui/QuantityButtons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import useStore from "@/store";
import { useAuth, useUser } from "@clerk/nextjs";
import { ShoppingBag, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Product } from "@/sanity.types";

type ProductMinimal = Product & {
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
};


/** Sanity address shape aligned with your schema (firstName + lastName) */
export interface ExtendedSanityAddress {
  _id: string;
  _type?: "address";
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  operator?: string; // short_code or id
  operatorRefId?: string; // ref_id from PayChangu
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  default?: boolean;
  createdAt?: string;
}

/** Operator shape returned from PayChangu API */
interface Operator {
  id: number | string;
  name: string;
  short_code: string;
  ref_id: string;
  logo?: string | null;
  supports_withdrawals?: boolean;
  supported_country?: { name: string; currency: string };
}

/** groupedItems from store -> we only need product part for rendering here */
type GroupedItem = { product: ProductMinimal };

/**
 * Cart Page
 */
const CartPage: React.FC = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [addresses, setAddresses] = useState<ExtendedSanityAddress[] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<ExtendedSanityAddress | null>(null);
  const [selectedOperatorRefId, setSelectedOperatorRefId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // store API (assumed stable)
  const {
    deleteCartProduct,
    getTotalPrice,
    getItemCount,
    getSubTotalPrice,
    resetCart,
  } = useStore();

  // we expect getGroupedItems to return an array of grouped product objects
  const groupedItems = useStore((state) => state.getGroupedItems()) as GroupedItem[] | undefined;
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // --- Fetch addresses from Sanity (typed) ---
  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const query = `*[_type=="address" && userId == $userId] | order(createdAt desc){
        _id, firstName, lastName, email, phone, operator, operatorRefId, address, city, state, zip, "default": default
      }`;
      const data = (await client.fetch(query, { userId: user.id })) as ExtendedSanityAddress[];
      setAddresses(data ?? []);
      const defaultAddr = data?.find((a) => a.default);
      setSelectedAddress(defaultAddr ?? (data && data.length ? data[0] : null));
      if (defaultAddr?.operatorRefId) setSelectedOperatorRefId(defaultAddr.operatorRefId);
    } catch (error) {
      console.error("Address fetching error", error);
      setAddresses([]);
      setSelectedAddress(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // --- Fetch PayChangu operators ---
  const fetchOperators = useCallback(async () => {
    try {
      const res = await fetch("/api/paychangu/get-operators");
      if (!res.ok) {
        console.error("fetchOperators: non-ok response", res.status);
        return;
      }
      const json = await res.json();
      const ops = Array.isArray(json.data) ? json.data : json;
      setOperators(ops as Operator[]);
    } catch (err) {
      console.error("Failed to fetch operators", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchOperators();
    }
  }, [user, fetchAddresses, fetchOperators]);

  // Helper: resolve a ref_id for an address (prefer operatorRefId; else map short_code -> ref_id)
  const resolveOperatorRefId = (addr: ExtendedSanityAddress | null): string | null => {
    if (!addr) return null;
    if (addr.operatorRefId) return addr.operatorRefId;
    if (addr.operator) {
      const found = operators.find(
        (op) => op.short_code === addr.operator || String(op.id) === addr.operator
      );
      return found ? found.ref_id : null;
    }
    return null;
  };

  // Reset cart with confirmation
  const handleResetCart = () => {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to reset your cart?")) {
      resetCart();
      toast.success("Cart reset successfully!");
    }
  };

 // Checkout using PayChangu mobile-money initialize endpoint via server route
const handleCheckout = async () => {
  if (!selectedAddress) {
    toast.error("Please select an address first.");
    return;
  }

  const operatorRefId = selectedOperatorRefId || resolveOperatorRefId(selectedAddress);
  if (!operatorRefId) {
    toast.error("Selected address does not have a mobile money operator configured.");
    return;
  }

  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  if (!userEmail) {
    toast.error("Please add an email to your profile for payment notifications.");
    return;
  }

  setLoading(true);

  try {
    const mobile = selectedAddress.phone;
    const amount = Number(getTotalPrice());
    if (Number.isNaN(amount)) {
      toast.error("Invalid order total");
      setLoading(false);
      return;
    }

    const chargeId = `order-${Date.now()}`;

    const payload = {
      mobile,
      mobile_money_operator_ref_id: operatorRefId,
      amount: amount.toString(),
      charge_id: chargeId,
      email: userEmail,
      first_name: selectedAddress.firstName || user?.firstName || "",
      last_name: selectedAddress.lastName || user?.lastName || "",
    };

    const res = await fetch("/api/mobile-money/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.status !== "success") {
      toast.error(data?.message || "Payment failed to start.");
      setLoading(false);
      return;
    }

    toast.success("Payment request sent. Please approve on your phone...");

    // ---- POLLING TO VERIFY PAYMENT ----
    const pollInterval = 3000; // 3 seconds
    const maxAttempts = 20; // ~1 minute max
    let attempts = 0;

    const intervalId = setInterval(async () => {
      attempts++;
      try {
        const verifyRes = await fetch(`/api/paychangu/verify?tx_ref=${data.reference}`);
        const verifyData = await verifyRes.json();

        if (verifyData.status === "success" || verifyData.payment_status === "successful") {
          clearInterval(intervalId);
          resetCart();
          window.location.href = `/success?tx_ref=${data.reference}&orderNumber=${chargeId}&transaction_id=${verifyData.transaction_id}`;
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          window.location.href = `/payment/failed?orderNumber=${chargeId}`;
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        clearInterval(intervalId);
        window.location.href = `/payment/failed?orderNumber=${chargeId}`;
      }
    }, pollInterval);

  } catch (err) {
    console.error("Checkout error:", err);
    toast.error("An error occurred while initiating payment.");
  } finally {
    setLoading(false);
  }
};



  // Render
  return (
    <div className="bg-gray-50 dark:bg-[#121212] pb-52 md:pb-10 transition-colors duration-300">
      {isSignedIn ? (
        <Container>
          {groupedItems && groupedItems.length ? (
            <>
              <div className="flex items-center justify-between py-5 text-black dark:text-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag />
                  <h1 className="font-bold text-2xl">Your Cart</h1>
                </div>
                <div className="md:hidden">
                  <AddNewAddress />
                </div>
              </div>

              <div className="grid lg:grid-cols-3 md:gap-8">
                {/* Products List */}
                <div className="lg:col-span-2 rounded-lg">
                  <div className="border bg-white dark:bg-[#1a1a1a] rounded-md transition-colors duration-300">
                    {groupedItems.map(({ product }) => {
                      const itemCount = getItemCount(product._id);
                      const priceNum = Number(product.price ?? 0);
                      return (
                        <div
                          key={product._id}
                          className="border-b last:border-b-0 p-2.5 flex items-center justify-between gap-5 border-gray-200 dark:border-gray-700 transition-colors duration-300"
                        >
                          <div className="flex flex-1 items-start gap-2 h-36 md:h-44">
                            {product.images && product.images.length > 0 && (
                              <Link
                                href={`/product/${product.slug?.current ?? ""}`}
                                className="border p-0.5 md:p-1 mr-2 rounded-md overflow-hidden group border-gray-200 dark:border-gray-700 transition-colors duration-300"
                              >
                                <Image
                                   src={urlFor(product.images[0]).url()} // ✅ generate the URL
                                  alt={product.name || "product image"}
                                  width={500}
                                  height={500}
                                  loading="lazy"
                                  className="w-32 md:w-40 h-32 md:h-40 object-cover group-hover:scale-105 hoverEffect"
                                />
                              </Link>
                            )}
                            <div className="h-full flex flex-1 flex-col justify-between py-1 text-black dark:text-gray-300 transition-colors duration-300">
                              <div className="flex flex-col gap-0.5 md:gap-1.5">
                                <h2 className="text-base font-semibold line-clamp-1">{product.name}</h2>
                                <p className="text-sm capitalize">
                                  Variant: <span className="font-semibold">{product.variant}</span>
                                </p>
                                <p className="text-sm capitalize">
                                  Status: <span className="font-semibold">{product.status}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AddToWishList product={product} />
                                    </TooltipTrigger>
                                    <TooltipContent className="font-bold">Add to Favorite</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Trash
                                        onClick={() => {
                                          deleteCartProduct(product._id);
                                          toast.success("Product deleted successfully!");
                                        }}
                                        className="w-4 h-4 md:w-5 md:h-5 mr-1 text-gray-500 dark:text-gray-300 hover:text-red-600 hoverEffect transition-colors duration-300"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent className="font-bold">Delete product</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-start justify-between h-36 md:h-44 p-0.5 md:p-1">
                            <PriceFormatter
                              amount={priceNum * itemCount}
                              className="font-bold text-lg text-black dark:text-gray-200 transition-colors duration-300"
                            />
                            <QuantityButtons product={product} />
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-4">
                      <Button onClick={handleResetCart} className="font-semibold" variant="destructive">
                        Reset Cart
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Order Summary & Address */}
                <div className="lg:col-span-1">
                  <div className="hidden md:inline-block w-full bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Order Summary</h2>
                    <div className="space-y-4 text-black dark:text-gray-300 transition-colors duration-300">
                      <div className="flex items-center justify-between">
                        <span>SubTotal</span>
                        <PriceFormatter amount={getSubTotalPrice()} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Discount</span>
                        <PriceFormatter amount={getSubTotalPrice() - getTotalPrice()} />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between font-semibold text-lg">
                        <span>Total</span>
                        <PriceFormatter
                          amount={getTotalPrice()}
                          className="text-lg font-bold text-black dark:text-gray-200"
                        />
                      </div>
                      <Button
                        className="w-full rounded-full tracking-wide font-semibold hoverEffect"
                        size="lg"
                        disabled={loading}
                        onClick={handleCheckout}
                      >
                        {loading ? "Please wait..." : "Proceed to Checkout"}
                      </Button>
                    </div>

                    {addresses && (
                      <div className="rounded-md bg-white dark:bg-[#1a1a1a] mt-5 transition-colors duration-300">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-black dark:text-white">Delivery Address</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <RadioGroup
                              // defaultValue should be the selected address if present
                              defaultValue={addresses.find((addr) => addr.default)?._id.toString()}
                              onValueChange={(val) => {
                                const found = addresses.find((a) => a._id.toString() === val);
                                if (found) {
                                  setSelectedAddress(found);
                                  setSelectedOperatorRefId(found.operatorRefId ?? "");
                                }
                              }}
                            >
                              {addresses.map((address) => (
                                <div
                                  key={address._id}
                                  onClick={() => {
                                    setSelectedAddress(address);
                                    setSelectedOperatorRefId(address.operatorRefId ?? "");
                                  }}
                                  className={`flex items-center space-x-2 mb-4 cursor-pointer ${
                                    selectedAddress?._id === address._id
                                      ? "text-shop-dark-yellow dark:text-shop-golden"
                                      : "text-black dark:text-gray-300"
                                  } transition-colors duration-300`}
                                >
                                  <RadioGroupItem value={address._id.toString()} />
                                  <Label htmlFor={`address-${address._id}`} className="grid gap-1.5 flex-1">
                                    <span className="font-semibold">
                                      {address.firstName} {address.lastName}
                                    </span>
                                    <span className="text-sm text-black/60 dark:text-gray-400">
                                      {address.address}, {address.city}, {address.state} {address.zip}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      Operator:{" "}
                                      {(
                                        (address.operatorRefId &&
                                          operators.find((o) => o.ref_id === address.operatorRefId)?.name) ||
                                        address.operator ||
                                        (resolveOperatorRefId(address)
                                          ? operators.find((o) => o.ref_id === resolveOperatorRefId(address))?.name
                                          : "Not set")
                                      )}
                                    </span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                            <div className="mt-3">
                              <AddNewAddress />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Order Summary */}
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-[#1a1a1a] pt-2 transition-colors duration-300">
                  <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-lg border border-gray-200 dark:border-gray-700 mx-4 space-y-3 transition-colors duration-300">
                    <h2 className="text-black dark:text-white">Order Summary</h2>
                    <div className="space-y-4 text-black dark:text-gray-300">
                      <div className="flex items-center justify-between">
                        <span>SubTotal</span>
                        <PriceFormatter amount={getSubTotalPrice()} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Discount</span>
                        <PriceFormatter amount={getSubTotalPrice() - getTotalPrice()} />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between font-semibold text-lg">
                        <span>Total</span>
                        <PriceFormatter
                          amount={getTotalPrice()}
                          className="text-lg font-bold text-black dark:text-gray-200"
                        />
                      </div>

                      {/* Operator select for mobile checkout */}
                      <div>
                        <Label>Mobile Money Operator</Label>
                        <select
                          value={
                            selectedOperatorRefId ||
                            (selectedAddress ? resolveOperatorRefId(selectedAddress) ?? "" : "")
                          }
                          onChange={(e) => setSelectedOperatorRefId(e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select Mobile Money Operator</option>
                          {operators.map((op) => (
                            <option key={op.id} value={op.ref_id}>
                              {op.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {!selectedAddress && (
                        <div>
                          <AddNewAddress />
                        </div>
                      )}

                      {selectedAddress && (
                        <Button
                          className="w-full rounded-full font-semibold tracking-wide hoverEffect"
                          size="lg"
                          disabled={loading}
                          onClick={handleCheckout}
                        >
                          {loading ? "Please wait..." : "Proceed to Checkout"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyCart />
          )}
        </Container>
      ) : (
        <NoAccessToCart />
      )}
    </div>
  );
};

export default CartPage;
