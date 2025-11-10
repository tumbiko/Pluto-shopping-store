'use client'
import {
  createPayChanguCheckoutSession as createCheckoutSession,
  Metadata,
} from '@/Actions/createCheckOutSession'
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

  console.log("user id: ",user?.id)

  const fetchAddresses = async () => {
  if (!user) return; // no user, no fetch
  setLoading(true);
  try {
    // Fetch only addresses for this user
    const query = `*[_type=="address" && userId == $userId] | order(publishedAt desc)`;
    const data: Address[] = await client.fetch(query, { userId: user.id });
    setAddresses(data);

    // Automatically select default or first address
    const defaultAddress = data.find(addr => addr.default);
    if (defaultAddress) {
      setSelectedAddress(defaultAddress);
    } else if (data.length > 0) {
      setSelectedAddress(data[0]);
    } else {
      setSelectedAddress(null); // No addresses yet
    }
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
      const confirmed = window.confirm(
        "Are you sure you want to reset your cart?"
      );
      if (confirmed) {
        resetCart();
        toast.success("Cart reset successfully!");
      }
    };
  const handleCheckout = async () => {
    setLoading(true);
    try {
      const metadata: Metadata = {
        orderNumber: crypto.randomUUID(),
        customerName: user?.fullName ?? "Unknown",
        customerEmail: user?.emailAddresses[0]?.emailAddress ?? "Unknown",
        clerkUserId: user?.id,
        address: selectedAddress,
      };
      const checkoutUrl = await createCheckoutSession(groupedItems, metadata);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-gray-50 pb-52 md:pb-10'>
      {isSignedIn ? ( 
        <Container>
            {groupedItems?.length ? <>
            <div className="flex items-center justify-between py-5">
  <div className="flex items-center gap-2">
    <ShoppingBag />
    <h1 className="font-bold text-2xl">Your Cart</h1>
  </div>

  {/* Show AddNewAddress on all devices, visible especially for mobile */}
  <div className="md:hidden">
    <AddNewAddress />
  </div>
</div>
            <div className="grid lg:grid-cols-3 md:gap-8">
              <div className="lg:col-span-2 rounded-lg ">
                <div className="border bg-white rounded-md">
                  {groupedItems?.map(({product})=>{
                    const itemCount = getItemCount(product._id);
                    return(
                      <div className="border-b p-2.5 last:border-b-0 flex items-center justify-between gap-5" key={product?._id}>
                        <div className="flex flex-1 items-start gap-2 h-36 md:h-44">
                          {product?.images && 
                          <Link href={`/product/${product?.slug?.current}`} className="border p-0.5 overflow-hidden md:p-1 mr-2 rounded-md group" >
                          <Image src={urlFor(product?.images[0]).url()}
                          alt="product image" width={500} height={500} loading="lazy"
                          className="w-32 md:w-40 h-32 md:h-40 object-cover group-hover:scale-105 hoverEffect"/>
                          </Link>}
                          <div className="h-full flex flex-1 flex-col justify-between py-1">
                            <div className="flex flex-col gap-0.5 md:gap-1.5">
                              <h2 className="text-base font-semibold line-clamp-1">{product?.name}</h2>
                              <p className="text-sm capitalize">
                                  Variant:{" "}
                                  <span className="font-semibold">
                                    {product?.variant}
                                  </span>
                                </p>
                              <p className="text-sm capitalize">
                                  Status:{" "}
                                  <span className="font-semibold">
                                    {product?.status}
                                  </span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AddToWishList className="relative top-0 right-0" product={product}/>
                                  </TooltipTrigger>
                                  <TooltipContent className="font-bold">
                                      Add to Favorite
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger>
                                      <Trash
                                        onClick={() => {
                                          deleteCartProduct(product?._id);
                                          toast.success(
                                            "Product deleted successfully!"
                                          );
                                        }}
                                        className="w-4 h-4 md:w-5 md:h-5 mr-1 text-gray-500 hover:text-red-600 hoverEffect"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent className="font-bold">
                                      Delete product
                                    </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start justify-between h-36 md:h-44 p-0.5 md:p-1">
                          <PriceFormatter
                              amount={(product?.price as number) * itemCount}
                              className="font-bold text-lg"
                            />
                            <QuantityButtons product={product} />
                        </div>
                      </div>
                    )
                  })}
                  <Button
                  onClick={handleResetCart}
                  className="m-5 font-semibold"
                  variant="destructive">
                  Reset Cart
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="hidden md:inline-block w-full bg-white p-6 rounded-lg border">
                  
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                       <span>SubTotal </span>
                       <PriceFormatter amount={getSubTotalPrice()}/> 
                      </div>
                      <div className="flex items-center justify-between">
                       <span>Discount </span>
                       <PriceFormatter amount={getSubTotalPrice() - getTotalPrice()}/> 
                      </div>
                      <Separator/>
                      <div className="flex items-center justify-between font-semibold text-lg">
                       <span>Total </span>
                       <PriceFormatter className="text-lg text-black font-bold" amount={getTotalPrice()}/> 
                      </div>
                      <Button className="w-full rounded-full tracking-wide font-semibold hoverEffect cursor-pointer" size={"lg"} disabled={loading} onClick={handleCheckout}>
                        {loading ? "Please wait..." : "Proceed to Checkout"}
                      </Button>
                    </div>
                  {addresses && <div className="rounded-md bg-white mt-5">
                    <Card>
                      <CardHeader>
                        <CardTitle>Delivery Address</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup defaultValue={addresses
                                ?.find((addr) => addr.default)
                                ?._id.toString()}>
                          {addresses.map((address) => (
                            <div key={address?._id}
                            onClick={() => setSelectedAddress(address)}
                                  className={`flex items-center space-x-2 mb-4 cursor-pointer ${selectedAddress?._id === address?._id && "text-shop-dark-yellow"}`}>
                              <RadioGroupItem value={address?._id.toString()}/>
                              <Label htmlFor={`address-${address?._id}`}
                                    className="grid gap-1.5 flex-1">
                                <span className="font-semibold">{address?.name}</span>
                                <span className="text-sm text-black/60">
                                      {address.address}, {address.city},{" "}
                                      {address.state} {address.zip}
                                    </span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        <AddNewAddress/>
                      </CardContent>
                    </Card>
                  </div> }
                </div>
              </div>
              {/* Order Summary for Mobile */}
<div className="md:hidden fixed bottom-0 left-0 w-full bg-white pt-2">
  <div className="bg-white p-4 rounded-lg border mx-4 space-y-3">
    <h2>Order Summary</h2>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span>SubTotal</span>
        <PriceFormatter amount={getSubTotalPrice()} />
      </div>
      <div className="flex items-center justify-between">
        <span>Discount</span>
        <PriceFormatter
          amount={getSubTotalPrice() - getTotalPrice()}
        />
      </div>
      <Separator />
      <div className="flex items-center justify-between font-semibold text-lg">
        <span>Total</span>
        <PriceFormatter
          amount={getTotalPrice()}
          className="text-lg font-bold text-black"
        />
      </div>
    </div>
    {/* Set Address Button for mobile if no address selected */}
    {!selectedAddress && (
      <AddNewAddress/>
    )}
    {/* Checkout Button */}
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
            </> : <EmptyCart/>}
        </Container> ) : (
        <NoAccessToCart/>
        )
      }
    </div>
  )
}

export default CartPage
