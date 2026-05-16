import ProductCard from '@/components/ui/ProductCard';
import { getDealProducts } from '@/sanity/queries'
import Container from '@/components/ui/container';
import React from 'react'

const DealPage = async() => {
  const products = await getDealProducts();
  return (
    <Container>
      
        <h2 className='mb-5 underline underline-offset-4 decoration-[1px] text-2xl pb-3 pl-5 font-bold font-sans text-shop-dark-yellow uppercase tracking-wide'>Hot Deals of the Week</h2>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-5'>
          {products?.map((product)=>(
            // @ts-expect-error due to async component
            <ProductCard key={product._id} product={product}/>
          ))}
        </div>
      
    </Container>
  )
}

export default DealPage
