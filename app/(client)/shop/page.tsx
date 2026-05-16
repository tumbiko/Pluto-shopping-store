import Shop from '@/components/ui/Shop';
import { getAllBrands, getCategories } from '@/sanity/queries'
import React from 'react'

const page = async() => {

  const categories = await getCategories();
    const brands = await getAllBrands();
  return (
    
    <div>
      <Shop categories={categories} brands={brands} />
    </div>
  )
}

export default page
