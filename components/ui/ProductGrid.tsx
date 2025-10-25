"use client";

import React, { use, useEffect } from "react";
import HomeTabBar from "./HomeTabBar";
import { productType } from "@/constants/data";
import { client } from "@/sanity/lib/client";
import { AnimatePresence, motion } from "motion/react"
import { Loader2 } from "lucide-react";
import NoProductAvailable from "./noProductAvailable";
import ProductCard from "./ProductCard";
import { Product } from "@/sanity.types";



const ProductGrid = () => {

    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [selectedTab, setSelectedTab] = React.useState(productType[0]?.title || '');

    const query = `*[_type == "product" && variant == $variant] | order(name desc) {
  ..., "categories" : categories[] -> title
}`;

const params = { variant: selectedTab.toLowerCase() };
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
  try {
    const response = await client.fetch(query, params);
    setProducts(response);
  } catch (error) {
    console.error("Error fetching products:", error);
    
  }finally{
    setLoading(false);
  }
  };
  fetchData();
}, [selectedTab]);


  return (
    <div>
      <HomeTabBar selectedTab={selectedTab} onTabSelect={setSelectedTab}/>
      {loading ? (<div className="flex flex-col items-center justify-center py-10 min-h-80 bg-gray-100 w-full mt-5">
        <div className="space-x-2 flex items-center text-gray-500">
          <Loader2 className="w-5 h-6 animate-spin"/>
          <span>products are loading...</span>
        </div>
      </div> ) :
        products?.length ? ( <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-10">
        {products?.map((product)=>(
          <AnimatePresence key={product?._id}>
            <motion.div layout initial={{opacity:0.2}} animate={{opacity:1}} exit={{opacity:0}}>
              <ProductCard product={product}/>
            </motion.div>
          </AnimatePresence>
        ))}
        </div> ) : ( <NoProductAvailable selectedTab={selectedTab}/>
      )}
    </div>
  )
}

export default ProductGrid
