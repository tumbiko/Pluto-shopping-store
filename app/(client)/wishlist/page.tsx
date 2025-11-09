import NoAccessToCart from '@/components/ui/NoAccessToCart';
import WishListProducts from '@/components/ui/WishListProducts';
import { currentUser } from '@clerk/nextjs/server'
import React from 'react'

const WishListPage = async() => {
    const user = await currentUser(); 
  return (
    <>
      {user ?  <WishListProducts/> : <NoAccessToCart details='login to view your wishlist items. Dont miss out on your cart products to make the payment'/>}
    </>
  )
}

export default WishListPage
export const dynamic = "force-dynamic";
export const revalidate = 0;

