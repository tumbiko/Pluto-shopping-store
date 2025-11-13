"use client";

import React from "react";
import HomeTabBar from "./HomeTabBar";
import { productType } from "@/constants/data";
import { client } from "@/sanity/lib/client";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import NoProductAvailable from "./noProductAvailable";
import ProductCard from "./ProductCard";
import { Product } from "@/sanity.types";

const ProductGrid = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState(productType[0]?.title || '');

  React.useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      const selected = (selectedTab || '').toLowerCase();

      const query = `*[_type == "product" && (
        $selected == "all" ||
        (defined(variant) && lower(variant) == $selected) ||
        ($selected in categories[]->title)
      )] | order(name desc){
        ...,
        "categories": categories[]->title
      }`;

      try {
        const response = await client.fetch(query, { selected });
        console.log('ProductGrid fetch result:', response?.length, 'for tab:', selectedTab);
        if (!mounted) return;

        if ((!response || response.length === 0) && selected !== 'all') {
          console.warn('No products for selected filter — fetching all as fallback');
          const all = await client.fetch(`*[_type == "product"]{..., "categories": categories[]->title} | order(name desc)`);
          if (!mounted) return;
          setProducts(all || []);
        } else {
          setProducts(response || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [selectedTab]);

  return (
    <div>
      <HomeTabBar selectedTab={selectedTab} onTabSelect={setSelectedTab} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 min-h-80 w-full mt-5 bg-gray-100 dark:bg-[#1a1a1a] transition-colors duration-300">
          <div className="space-x-2 flex items-center text-gray-500 dark:text-gray-300">
            <Loader2 className="w-5 h-6 animate-spin" />
            <span>products are loading...</span>
          </div>
        </div>
      ) : products?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-10">
          {products.map((product) => (
            <AnimatePresence key={product?._id}>
              <motion.div layout initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProductCard product={product} />
              </motion.div>
            </AnimatePresence>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <NoProductAvailable selectedTab={selectedTab} className="text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
