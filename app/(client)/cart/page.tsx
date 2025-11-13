'use client'
import Container from "@/components/Container";
import AddNewAddress from '@/components/ui/AddNewAddress';
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
import { Address } from "@/sanity.types";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import useStore from "@/store";
import { useAuth, useUser } from "@clerk/nextjs";
import { ShoppingBag, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const CartPage = () => {
  const {
    deleteCartProduct,
    getTotalPrice,
    getItemCount,
    getSubTotalPrice,
    resetCart,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const groupedItems = useStore((state) => state.getGroupedItems());
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const fetchAddresses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const query = `*[_type=="address" && userId == $userId] | order(publishedAt desc)`;
      const data: Address[] = await client.fetch(query, { userId: user.id });
      setAddresses(data);
      const defaultAddress = data.find(addr => addr.default);
      setSelectedAddress(defaultAddress || data[0] || null);
    } catch (error) {
      console.error("Address fetching error", error);
      setAddresses([]);
      setSelectedAddress(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const handleResetCart = () => {
    if (window.confirm("Are you sure you want to reset your cart?")) {
      resetCart();
      toast.success("Cart reset successfully!");
    }
  };


const handleCheckout = async () => {
  if (!selectedAddress) {
    toast.error("Please select an address first.");
    return;
  }

  if (!user?.emailAddresses?.[0]?.emailAddress) {
    toast.error("Please add an email to your profile for payment notifications.");
    return;
  }

  setLoading(true);

  try {
    // Only send fields PayChangu expects minus charge_id
    const payload = {
      amount: getTotalPrice(),
      email: user.emailAddresses[0].emailAddress,
    };

    console.log("💳 Checkout payload:", payload);

    const res = await fetch("/api/paychangu/mobile-money", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("📤 PayChangu API response:", data, res.status);

    if (!res.ok) {
      toast.error(data.error || "Payment failed to start.");
      return;
    }

    toast.success(
      "Payment request sent. Please approve the charge on your phone."
    );

  } catch (error) {
    console.error("❌ Checkout error:", error);
    toast.error("Something went wrong.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className='bg-gray-50 dark:bg-[#121212] pb-52 md:pb-10 transition-colors duration-300'>
      {isSignedIn ? (
        <Container>
          {groupedItems?.length ? (
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
                    {groupedItems?.map(({ product }) => {
                      const itemCount = getItemCount(product._id);
                      return (
                        <div
                          key={product?._id}
                          className="border-b last:border-b-0 p-2.5 flex items-center justify-between gap-5 border-gray-200 dark:border-gray-700 transition-colors duration-300"
                        >
                          <div className="flex flex-1 items-start gap-2 h-36 md:h-44">
                            {product?.images && (
                              <Link href={`/product/${product?.slug?.current}`} className="border p-0.5 md:p-1 mr-2 rounded-md overflow-hidden group border-gray-200 dark:border-gray-700 transition-colors duration-300">
                                <Image
                                  src={urlFor(product?.images[0]).url()}
                                  alt="product image"
                                  width={500}
                                  height={500}
                                  loading="lazy"
                                  className="w-32 md:w-40 h-32 md:h-40 object-cover group-hover:scale-105 hoverEffect"
                                />
                              </Link>
                            )}
                            <div className="h-full flex flex-1 flex-col justify-between py-1 text-black dark:text-gray-300 transition-colors duration-300">
                              <div className="flex flex-col gap-0.5 md:gap-1.5">
                                <h2 className="text-base font-semibold line-clamp-1">{product?.name}</h2>
                                <p className="text-sm capitalize">
                                  Variant: <span className="font-semibold">{product?.variant}</span>
                                </p>
                                <p className="text-sm capitalize">
                                  Status: <span className="font-semibold">{product?.status}</span>
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
                                          deleteCartProduct(product?._id);
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
                              amount={(product?.price as number) * itemCount}
                              className="font-bold text-lg text-black dark:text-gray-200 transition-colors duration-300"
                            />
                            <QuantityButtons product={product} />
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      onClick={handleResetCart}
                      className="m-5 font-semibold"
                      variant="destructive"
                    >
                      Reset Cart
                    </Button>
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
                        <PriceFormatter amount={getTotalPrice()} className="text-lg font-bold text-black dark:text-gray-200" />
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
                            <RadioGroup defaultValue={addresses.find(addr => addr.default)?._id.toString()}>
                              {addresses.map((address) => (
                                <div
                                  key={address?._id}
                                  onClick={() => setSelectedAddress(address)}
                                  className={`flex items-center space-x-2 mb-4 cursor-pointer ${
                                    selectedAddress?._id === address?._id ? "text-shop-dark-yellow dark:text-shop-golden" : "text-black dark:text-gray-300"
                                  } transition-colors duration-300`}
                                >
                                  <RadioGroupItem value={address?._id.toString()} />
                                  <Label htmlFor={`address-${address?._id}`} className="grid gap-1.5 flex-1">
                                    <span className="font-semibold">{address?.name}</span>
                                    <span className="text-sm text-black/60 dark:text-gray-400">
                                      {address.address}, {address.city}, {address.state} {address.zip}
                                    </span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                            <AddNewAddress />
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
                        <PriceFormatter amount={getTotalPrice()} className="text-lg font-bold text-black dark:text-gray-200" />
                      </div>
                    </div>

                    {!selectedAddress && <AddNewAddress />}

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
