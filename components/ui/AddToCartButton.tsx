'use client'
import React from 'react'
import { Product } from '@/sanity.types'
import { ShoppingBag } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import useStore from '@/store';
import toast from 'react-hot-toast';
import PriceFormatter from './PriceFormatter';
import QuantityButtons from './QuantityButtons';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
}

const AddToCartButton = ({ product, className }: AddToCartButtonProps) => {

  const {addItem,getItemCount} = useStore();
  const itemCount = getItemCount(product?._id);
  // ...component logic
  const isOutOfStock = product?.stock === 0;
  const handleAddToCart = () => {
    if((product?.stock as number) > itemCount){
      addItem(product)
      toast.success(`${product?.name?.substring(0,20)}... added to cart!`)
    }
    else{
      toast.error(`Cannot add more than available stock!`);
    }
  }
  return (
    <div>
    {itemCount? (
      <div className='text-sm w-full'>
        <div className='flex items-center justify-between'>
          <span className='text-xs text-black/80'>Quantity</span>
          <QuantityButtons product={product}/>
        </div>
        <div className='flex justify-between border-t items-center pt-1'>
          <span className='text-xs font-semibold'>Subtotal</span>
          <PriceFormatter amount={(product?.price as number) * itemCount}/>
        </div>
      </div>
    ): (
      <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={cn(
            "w-full bg-shop-dark-yellow/80 shadow-none border border-shop-dark-yellow/80 font-semibold tracking-wide text-white hover:bg-shop-dark-yellow hover:border-shop-dark-yellow hoverEffect",
            className
          )}
        >
          <ShoppingBag /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
    )}
    </div>
  )
}

export default AddToCartButton