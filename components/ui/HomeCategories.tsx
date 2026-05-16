import React from 'react'
import { Category } from '@/sanity.types'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import Link from 'next/link'
import { GitCompareArrows, Headset, ShieldCheck, Truck } from 'lucide-react'

const extraData = [
  {
    title: "Free Delivery",
    description: "Free shipping for items costing over K100,000",
    icon: <Truck size={45} />,
  },
  {
    title: "Free Return",
    description: "Free returns for eligible items",
    icon: <GitCompareArrows size={45} />,
  },
  {
    title: "Customer Support",
    description: "Friendly 24/7 customer support",
    icon: <Headset size={45} />,
  },
  {
    title: "Money Back Guarantee",
    description: "Quality checked by our team",
    icon: <ShieldCheck size={45} />,
  },
]

const HomeCategories = ({ categories }: { categories: Category[] }) => {
  return (
    <div className="bg-white dark:bg-black border border-[rgba(245,224,207,0.5)] dark:border-gray-700 rounded-md my-2 p-5 lg:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Section title */}
      <h2 className="border-b border-shop-golden/30 dark:border-gray-600 text-2xl pb-3 font-bold text-shop-dark-yellow dark:text-shop-golden tracking-wide">
        Popular Categories
      </h2>

      {/* Categories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {categories?.map((category) => (
          <div
            key={category._id}
            className="flex items-center gap-3 bg-shop-light-bg dark:bg-gray-900 border border-transparent hover:border-shop-golden/40 dark:hover:border-shop-golden/50 rounded-md p-4 transition-all duration-300 group cursor-pointer"
          >
            {category.image && (
              <Link
                href={`/category/${category?.slug?.current}`}
                className="shrink-0 overflow-hidden border border-shop-golden/20 dark:border-gray-700 rounded-md w-20 h-20 flex items-center justify-center bg-white dark:bg-black group-hover:border-shop-golden"
              >
                <Image
                  src={urlFor(category?.image).url()}
                  alt={category?.name || "Category image"}
                  width={80}
                  height={80}
                  className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
              </Link>
            )}
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 group-hover:text-shop-dark-yellow dark:group-hover:text-shop-golden transition-colors duration-300">
                {category?.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-shop-golden">
                  ({category?.productCount})
                </span>{" "}
                items available
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Extra Info Grid */}
      <div className="mt-8 bg-shop-light-bg dark:bg-gray-900 rounded-md mx-1 lg:mx-2 py-5 px-3 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {extraData?.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-md group hover:bg-white dark:hover:bg-black border border-transparent hover:border-shop-golden/30 dark:hover:border-shop-golden/40 transition-all duration-300"
            >
              <span className="text-shop-golden group-hover:scale-90 transition-transform duration-300">
                {item?.icon}
              </span>
              <div className="text-sm">
                <p className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-shop-dark-yellow dark:group-hover:text-shop-golden transition-colors">
                  {item?.title}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{item?.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomeCategories
