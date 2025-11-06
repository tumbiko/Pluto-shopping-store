'use client'
import { BRANDS_QUERYResult, Category, Product } from '@/sanity.types'
import React, { useEffect, useState } from 'react'
import Container from '../Container'
import BrandList from './shop/BrandList'
import CategoryList from './shop/CategoryList'
import { client } from '@/sanity/lib/client'
import { useSearchParams } from 'next/navigation'
import ProductCard from './ProductCard'
import PriceList from './shop/PriceList'
import { Loader2 } from 'lucide-react'
import NoProductAvailable from './noProductAvailable'

interface Props{
  categories: Category[];
  brands: BRANDS_QUERYResult;
}

const Shop = ({ categories, brands }: Props) => {
  const searchParams = useSearchParams();
  const brandParams = searchParams?.get("brand");
  const categoryParams = searchParams?.get("category");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryParams || null
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    brandParams || null
  );
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let minPrice = 0;
      let maxPrice = 10000;
      if (selectedPrice) {
        const [min, max] = selectedPrice.split("-").map(Number);
        minPrice = min;
        maxPrice = max;
      }
      const query = `
      *[_type == 'product' 
        && (!defined($selectedCategory) || references(*[_type == "category" && slug.current == $selectedCategory]._id))
        && (!defined($selectedBrand) || references(*[_type == "brand" && slug.current == $selectedBrand]._id))
        && price >= $minPrice && price <= $maxPrice
      ] 
      | order(name asc) {
        ...,"categories": categories[]->title
      }
    `;
      const data = await client.fetch(
        query,
        { selectedCategory, selectedBrand, minPrice, maxPrice },
        { next: { revalidate: 0 } }
      );
      setProducts(data || []);
    } catch (error) {
      console.log("Shop product fetching Error", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedBrand, selectedPrice]);

  const handleReset = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedPrice(null);
  };

  return (
    <div className='border-t'>
      <Container className='mt-5'>
        <div className='sticky top-0 z-10 mb-5'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-bold font-sans text-shop-dark-yellow uppercase tracking-wide'>
              Products Filter
            </h2>
            <button
              onClick={handleReset}
              className="text-shop-dark-yellow underline text-sm mt-2 font-medium hover:text-red-950 hoverEffect"
            >
              Reset
            </button>
          </div>
        </div>

        {/* MAIN LAYOUT: sidebar + content */}
        <div className='flex flex-row gap-2 border-t border-t-shop-dark-yellow/50 '>

          {/* Sidebar: auto-width to content but capped so it never dominates */}
          <aside
            className='sticky top-20 scrollbar-hide self-start max-h-[calc(100vh-160px)] overflow-y-auto w-max max-w-[45%] min-w-[9rem] md:w-72 md:min-w-[18rem] pb-5 md:border-r border-r-shop-dark-yellow pr-2'
            aria-label='Filters'
          >
            <CategoryList
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            <BrandList
              brands={brands}
              setSelectedBrand={setSelectedBrand}
              selectedBrand={selectedBrand}
            />
            <PriceList setSelectedPrice={setSelectedPrice}
              selectedPrice={selectedPrice}/>
          </aside>

          {/* Product area: fills remaining space and is allowed to shrink */}
          <main className='flex-1 min-w-0'>
            {loading ? ( <div>
              <Loader2 className="w-10 h-10 text-shop-dark-yellow animate-spin mx-auto my-10" />
            
              <p className='py-10 text-center'>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <NoProductAvailable/>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  )
}

export default Shop
