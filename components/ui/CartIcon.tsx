import React from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

const CartIcon = () => {
  return (
    <Link href="/cart" className='group relative'>
      <ShoppingBag className='w-5 h-5 hover:text-shop-dark-yellow hoverEffect'/>
      <span className='absolute -top-1 -right-1 bg-shop-dark-yellow text-white 
      h-3.5 w-3.5 rounded-full text-xs font-semibold grid place-items-center'>0</span>
    </Link>
  )
}

export default CartIcon
