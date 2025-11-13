import { Product } from '@/sanity.types'
import { urlFor } from '@/sanity/lib/image'
import { Flame, StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import AddToWishListButton from './AddToWishListButton'
import PriceView from './PriceView'
import AddToCartButton from './AddToCartButton'

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="w-full h-full text-sm border border-neutral-200 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-900 group flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Image area */}
      <div className="relative bg-neutral-100 dark:bg-neutral-800 w-full aspect-[4/3] overflow-hidden">
        {product?.images && (
          <Link href={`/product/${product?.slug?.current}`} className="block w-full h-full">
            <Image
              src={urlFor(product?.images[0]).url()}
              alt={product?.name || 'Product image'}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-contain transition-transform duration-500 ${
                product?.stock !== 0 ? 'group-hover:scale-105' : 'opacity-50'
              }`}
              priority
            />
          </Link>
        )}

        {/* Wishlist & badges */}
        <AddToWishListButton product={product} />

        {product?.status === 'sale' ? (
          <p className="absolute top-2 left-2 z-10 text-xs px-2 rounded-full border border-yellow-400 text-yellow-600 dark:text-yellow-400 dark:border-yellow-400 bg-white/70 dark:bg-yellow-900/20 font-medium">
            Sale!
          </p>
        ) : product?.status === 'hot' ? (
          <Link
            href="/deal"
            className="absolute top-2 left-2 z-10 p-1 rounded-full border border-red-500 bg-white/70 dark:bg-red-900/20 hover:bg-red-500 hover:text-white transition"
          >
            <Flame size={18} fill="#ef4444" className="text-red-500" />
          </Link>
        ) : product?.status === 'new' ? (
          <p className="absolute top-2 left-2 z-10 text-xs px-2 rounded-full border border-green-500 text-green-600 dark:text-green-400 dark:border-green-400 bg-white/70 dark:bg-green-900/20 font-medium">
            New!
          </p>
        ) : null}
      </div>

      {/* Content area */}
      <div className="p-3 flex flex-col gap-1 cursor-pointer flex-1 text-neutral-800 dark:text-neutral-200">
        {product?.categories && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 capitalize line-clamp-1">
            {product?.categories.map((cat) => cat).join(', ')}
          </p>
        )}

        <h1 className="text-sm font-medium line-clamp-1 hover:line-clamp-none hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">
          <Link href={`/product/${product?.slug?.current}`}>{product?.name}</Link>
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
              const filled = index < 4
              return (
                <StarIcon
                  key={index}
                  size={12}
                  stroke="#facc15"
                  fill={filled ? '#fde047' : 'none'}
                  className="mr-0.5"
                />
              )
            })}
          </div>
          <p className="text-xs tracking-wide text-neutral-500 dark:text-neutral-400">5 reviews</p>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-2.5"> 
          <p className="font-medium">In Stock</p> 
        <p className={`${
              product?.stock === 0
                ? 'text-red-600 dark:text-red-400'
                : 'font-semibold text-yellow-600 dark:text-yellow-400'
            }`}>{(product?.stock as number) > 0? product?.stock:"Unavailable"}</p> </div>

        {/* Price */}
        <PriceView price={product?.price} discount={product?.discount} className="text-sm font-semibold" />

        {/* Add to cart */}
        <div className="mt-2">
          <AddToCartButton className="w-full sm:w-36 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium" product={product} />
        </div>
      </div>
    </div>
  )
}

export default ProductCard
