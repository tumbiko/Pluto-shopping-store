'use client'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Product } from '@/sanity.types';
import React, { useEffect, useState } from "react";
import useStore from '@/store';
import toast from 'react-hot-toast';

const FavoriteButton = ({
  showProduct = false,
  product,
}: {
  showProduct?: boolean;
  product?: Product | null;
}) => {
  const { favoriteProduct, addToFavorite } = useStore();
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  useEffect(() => {
    const availableItem = favoriteProduct.find(
      (item) => item?._id === product?._id
    );
    setExistingProduct(availableItem || null);
  }, [product, favoriteProduct]);

  const handleFavorite = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    if (product?._id) {
      addToFavorite(product).then(() => {
        toast.success(
          existingProduct
            ? "Product removed successfully!"
            : "Product added successfully!"
        );
      });
    }
  };
  return (
    <>
      {!showProduct ? (
        <Link href={"/wishlist"} className="group relative">
          <Heart className="w-5 h-5 hover:text-shop-dark-yellow hoverEffect" />
          <span className="absolute -top-1 -right-1 bg-shop-dark-yellow text-white h-3.5 w-3.5 rounded-full text-xs font-semibold flex justify-center">
           {favoriteProduct?.length ? favoriteProduct?.length : 0}
          </span>
        </Link>
      ) : (
        <button
          onClick={handleFavorite}
          className="group relative hover:text-shop-yellow hoverEffect border border-shop-yellow/80 hover:border-shop-dark-yellow p-1.5 rounded-sm"
        >
          {existingProduct ? (
            <Heart
              fill="#D9A21A"
              className="text-shop-yellow/80 group-hover:text-shop-dark-yellow hoverEffect mt-.5 w-5 h-5"
            />
          ) : (
            <Heart className="text-shop-dark-yellow/80 group-hover:text-shop-dark-yellow hoverEffect mt-.5 w-5 h-5" />
          )}
        </button>
      )}
    </>
  )
}

export default FavoriteButton
