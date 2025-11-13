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
  const { addItem, getItemCount } = useStore();
  const itemCount = getItemCount(product?._id);
  const isOutOfStock = product?.stock === 0;

  const handleAddToCart = () => {
    if ((product?.stock as number) > itemCount) {
      addItem(product)
      toast.success(`${product?.name?.substring(0,20)}... added to cart!`)
    } else {
      toast.error(`Cannot add more than available stock!`);
    }
  }

  return (
    <div>
      {itemCount ? (
        <div className='text-sm w-full transition-colors duration-300'>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-black/80 dark:text-gray-300'>Quantity</span>
            <QuantityButtons product={product} />
          </div>
          <div className='flex justify-between border-t border-gray-300 dark:border-gray-700 items-center pt-1'>
            <span className='text-xs font-semibold text-black/80 dark:text-gray-300'>Subtotal</span>
            <PriceFormatter amount={(product?.price as number) * itemCount} className="text-black/90 dark:text-gray-200" />
          </div>
        </div>
      ) : (
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={cn(
            "w-full bg-shop-dark-yellow/80 dark:bg-shop-golden/80 shadow-none border border-shop-dark-yellow/80 dark:border-shop-golden/80 font-semibold tracking-wide text-black dark:text-black hover:bg-shop-dark-yellow dark:hover:bg-shop-golden hover:border-shop-dark-yellow dark:hover:border-shop-golden hoverEffect transition-colors duration-300",
            className
          )}
        >
          <ShoppingBag className="mr-2" /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      )}
    </div>
  )
}

export default AddToCartButton
