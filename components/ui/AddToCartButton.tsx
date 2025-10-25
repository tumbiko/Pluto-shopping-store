'use client'
import React from 'react'
import { Product } from '@/sanity.types'
import { ShoppingBag } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
}

const AddToCartButton = ({ product, className }: AddToCartButtonProps) => {
  // ...component logic
  const isOutOfStock = product?.stock === 0;
  const handleAddToCart = () => {
    window.alert('Added to cart')
  }
  return (
    <div>
    <Button onClick={handleAddToCart} disabled={isOutOfStock} className={cn(
            "w-full bg-shop-dark-yellow/80 text-shop-light-bg shadow-none border border-shop-dark-yellow/80 font-semibold tracking-wide hover:bg-shop-dark-yellow hover:border-shop-dark-yellow hoverEffect",
            className
          )}>
        <ShoppingBag/> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
    </Button>
    </div>
  )
}

export default AddToCartButton