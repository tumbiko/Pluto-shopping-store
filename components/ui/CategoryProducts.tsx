'use client'
import { Category, Product } from '@/sanity.types'
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import { Button } from './button';
import { client } from '@/sanity/lib/client';
import {AnimatePresence, motion} from 'motion/react'
import { Loader2 } from 'lucide-react';
import NoProductAvailable from './noProductAvailable';
import ProductCard from './ProductCard';

interface Props{
    categories: Category[];
    slug: string;
}

const CategoryProducts = ({categories,slug}:Props) => {

    const [currentSlug, setCurrentSlug] = React.useState(slug);
    const [products, setProducts] = React.useState<Product[]>([]);
   const handleCategoryChange = (newSlug: string) => {
    if (newSlug === currentSlug) return; // Prevent unnecessary updates
    setCurrentSlug(newSlug);
    router.push(`/category/${newSlug}`, { scroll: false }); // Update URL without
  };
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();

    const fetchProducts = async(categorySlug: string)=>{
        setLoading(true);
        try{
            const query = `
        *[_type == 'product' && references(*[_type == "category" && slug.current == $categorySlug]._id)] | order(name asc){
        ...,"categories": categories[]->title}
      `;
      const data = await client.fetch(query, { categorySlug });
      setProducts(data);

        } catch(error){
            console.error("Error fetching products:", error);
            setProducts([]);

        }
        finally{
            setLoading(false);
        }
    }
    useEffect(()=>{
        fetchProducts(currentSlug);

    },[currentSlug]);

  return (
    <div className="py-5 flex flex-col md:flex-row items-start gap-5">
   <div className="border gap-2 
                grid grid-cols-4 sm:grid-cols-4 
                md:flex md:flex-col md:min-w-40 md:gap-0 justify-start">
  {categories?.map((item) => (
    <Button
      onClick={() => handleCategoryChange(item?.slug?.current as string)}
      key={item?._id}
      className={`w-full box-border min-h-[44px] md:w-full bg-transparent border border-transparent md:border-0 p-2 rounded text-darkColor shadow-none hover:bg-shop-dark-blue hover:text-white font-semibold transition-colors capitalize ${
        item?.slug?.current === currentSlug ? 'bg-shop-dark-blue text-white' : ''
      }`}
    >
      <span className="block text-sm leading-snug whitespace-normal break-words">
        {item?.name}
      </span>
    </Button>
  ))}
</div>

    <div className='flex-1'>
        {loading ? (
          <div className="flex flex-col  items-center justify-center py-10 min-h-80 space-y-4 text-center bg-gray-100 rounded-lg w-full">
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Products are loading...</span>
            </div>
          </div>
        ) : products?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {products?.map((product: Product) => (
              <AnimatePresence key={product._id}>
                <motion.div>
                  <ProductCard product={product} />
                </motion.div>
              </AnimatePresence>
            ))}
          </div>
        ) : (
          <NoProductAvailable
            selectedTab={currentSlug}
            className="mt-0 w-full"
          />
        )}
    </div>
    </div>
  )
}

export default CategoryProducts
