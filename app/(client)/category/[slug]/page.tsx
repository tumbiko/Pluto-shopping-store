import Container from '@/components/Container'
import CategoryProducts from '@/components/ui/CategoryProducts'
import { getCategories } from '@/sanity/queries'
import React from 'react'

const CategoryPage = async({params,}:{params:Promise<{slug:string}>}) => {
  const categories = await getCategories()
  const {slug} = await params;
  return (
    <div>
      <Container>
        <h2 className='mb-5 decoration-[1px] text-2xl pb-3 pl-5 font-bold font-sans uppercase tracking-wide'>Products by category: {" "}
          <span className='font-bold capitalize tracking-wide text-shop-golden'>{slug && slug}</span>
        </h2>
       <CategoryProducts categories={categories} slug={slug}/>
      </Container>
    </div>
  )
}

export default CategoryPage
