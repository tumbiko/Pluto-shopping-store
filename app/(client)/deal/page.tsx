import Container from '@/components/Container';
import ProductCard from '@/components/ui/ProductCard';
import { getDealProducts } from '@/sanity/queries'
import React from 'react'

const DealPage = async() => {
  const products = await getDealProducts();
  return (
    <div className='py-10 bg-shop-light-bg flex justify-center flex-col mx-5'>
      
        <h2 className='mb-5 underline underline-offset-4 decoration-[1px] text-2xl pb-3 pl-5 font-bold font-sans text-shop-dark-yellow uppercase tracking-wide'>Hot Deals of the Week</h2>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 m-5'>
          {products?.map((product)=>(
            // @ts-ignore
            <ProductCard key={product._id} product={product}/>
          ))}
        </div>
      
    </div>
  )
}

export default DealPage
