import { productType } from '@/constants/data'
import Link from 'next/link'
import React from 'react'

interface Props{
  selectedTab: string;
  onTabSelect: (tab: string) => void;
}

const HomeTabBar = ({ selectedTab, onTabSelect }: Props) => {
  return (
    <div className='flex flex-wrap gap-5 items-center justify-between'>
      <div className='flex items-center gap-3 text-sm font-semibold'>
        {productType?.map((item) => {
          const isActive = selectedTab === item?.title;
          return (
            <button
              key={item?.title}
              onClick={() => onTabSelect(item?.title)}
              className={`btn-tab border rounded-full py-1.5 px-4 md:px-6 text-sm font-medium
                ${isActive ? 'btn-tab--active' : ''}`}
              aria-pressed={isActive}
            >
              {item?.title}
            </button>
          )
        })}
      </div>

      <Link
        href="/shop"
        className="btn-tab border rounded-full py-1.5 px-4 md:px-6 text-sm font-medium"
      >
        See all
      </Link>
    </div>
  )
}

export default HomeTabBar
