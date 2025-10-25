import { Product } from '@/sanity.types'
import { urlFor } from '@/sanity/lib/image'
import { Flame, StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import AddToWishListButton from './AddToWishListButton'
import PriceView from './PriceView'
import AddToCartButton from './AddToCartButton'

const ProductCard = ({product}:{product: Product}) => {
  return (
    <div className='text-sm border-[1px] border-[rgba(245,224,207,0.5)] rounded-md bg-white group'>
    <div className='relative group overflow-hidden bg-shop-light-bg '>
      {product?.images && (<Link href={`/product/${product?.slug?.current}`}> <Image src={urlFor(product?.images[0]).url()} alt='Product image' width={700} height={700}
      priority
      className={`w-full h-64 object-contain overflow-hidden transition-transform bg-shop_light_bg duration-500 
      ${product?.stock !== 0 ? "group-hover:scale-105" : "opacity-50"}`}/></Link>)}
      
      <AddToWishListButton product= {product}/> 
      {product?.status === "sale" ? (
        <p className="absolute top-2 left-2 z-10 text-xs px-2 rounded-full border border-black/50 group-hover:border-shop-golden group-hover:text-shop-golden cursor-pointer hoverEffect">
          Sale!
        </p>
      ) : product?.status === "hot" ? (
        <Link
          href={"/deal"}
          className="absolute top-2 left-2 z-10 border border-shop-yellow p-1 rounded-full group-hover:border-shop-golden hover:text-shop-dark-yellow hoverEffect"
        >
          <Flame
            size={18}
            fill="#fb6c08"
            className="text-shop-golden/50 group-hover:text-shop-golden hoverEffect"
          />
        </Link>
      ) : product?.status === "new" ? (
        <p className="absolute top-2 left-2 z-10 text-xs px-2 rounded-full border border-black/50 group-hover:border-shop-golden group-hover:text-shop-golden cursor-pointer hoverEffect">
          New!
        </p>
      ) : null}
    </div>
    <div className='p-3 flex flex-col gap-1 cursor-pointer shadow-md'>
      {product?.categories && <p className='text-xs text-gray-500 mb-1 capitalize line-clamp-1'>{product?.categories.map((cat)=>cat).join(", ")}</p>}
      <h1 className='text-sm line-clamp-1 hover:line-clamp-none'>{product?.name}</h1>
      <div className='flex items-center gap-2' >
        <div className='flex items-center gap-0.5'>
  {[...Array(5)].map((_, index) => {
    const filled = index < 4; // adjust as needed
    return (
      <StarIcon
        key={index}
        size={12}
        // stroke is the outline color, fill is the interior
        stroke={filled ? "#D9A21A" : "#D9A21A"}   // outline color: golden for both filled & empty
        fill={filled ? "#FFE58F" : "none"}        // filled interior for rated stars, transparent for unrated
        className="mr-1"
        aria-hidden
      />
    );
  })}
</div>
<p className='text-xs tracking-wide text-gray-500'>5 reviews</p>

      </div>
      <div className='flex items-center gap-2.5'>
        <p className='font-medium'>In Stock</p>
        <p className={` ${product?.stock === 0 ? "text-red-600" : "font-semibold text-shop-golden"}`}>{(product?.stock as number) > 0? product?.stock:"Unavailable"}</p>
      </div>
      <PriceView
  price={product?.price}
  discount={product?.discount}
  className="text-sm font-semibold"
/>
 <AddToCartButton className="w-36 rounded-full" product= {product}/>
    </div>
    
  </div>
  )
}

export default ProductCard
