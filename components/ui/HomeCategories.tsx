import React from 'react'
import { Category } from '@/sanity.types'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import Link from 'next/link'
import {GitCompareArrows, Headset, ShieldCheck, Truck} from 'lucide-react'

const extraData = [
  {
    title: "Free Delivery",
    description: "Free shipping for items costing over K100, 000",
    icon: <Truck size={45} />,
  },
  {
    title: "Free Return",
    description: "Free shipping for items costing over K100, 000",
    icon: <GitCompareArrows size={45} />,
  },
  {
    title: "Customer Support",
    description: "Friendly 27/7 customer support",
    icon: <Headset size={45} />,
  },
  {
    title: "Money Back guarantee",
    description: "Quality checked by our team",
    icon: <ShieldCheck size={45} />,
  },
];


const HomeCategories = ({categories}:{categories: Category[]}) => {
  return (
    <div className='bg-white my:1 border border-shop-dark-yellow/10 md:my-2 p-5 lg:p-7 rounded:md '>
      <h2 className='border-b text-2xl pb-3 font-bold font-sans text-shop-dark-yellow capitalize tracking-wide'>Popular Categories</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 mt-2'>
        {categories?.map((category)=>(
          <div key={category._id} className='flex items-center gap-1 group bg-shop-light-bg p-5 rounded-md m-2'>
            {category.image && (
              <div className='overflow-hidden border rounded-md border-shop-golden/20
              hover:border-shop-golden w-20 h-20 p-1'>
                <Link href={`/category/${category?.slug?.current}`}>
                <Image src={urlFor(category?.image).url()}
            alt="category image" width={500} height={500} className='w-fullh-full object-contain group-hover:scale-110 hoverEffect'
            />
                </Link>
              </div>
            )}
            <div className='space-y-1'>
              <h3 className='text-base font-semibold'>{category?.name}</h3>
              <p className='text-sm'><span className='font-bold text-shop-dark-yellow'>{`(${category?.productCount})`}</span> items available</p>
            </div>
          </div>
        ))}
      </div>
      <div className='mb-1 lg:pb-2 bg-shop-light-bg lg:p-2 rounded-md mx-2 mt-3'>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-1 shadow-sm hover:shadow-shop-golden/20 py-5">
        {extraData?.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 group text-lightColor hover:text-shop-dark-yellow hoverEffect"
          >
            <span className="inline-flex scale-100 group-hover:scale-90 hoverEffect">
              {item?.icon}
            </span>
            <div className="text-sm">
              <p className="text-darkColor/80 font-bold capitalize">
                {item?.title}
              </p>
              <p className="text-lightColor">{item?.description}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

export default HomeCategories