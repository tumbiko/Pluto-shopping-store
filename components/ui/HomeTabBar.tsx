import { productType } from '@/constants/data'
import Link from 'next/link'
import React from 'react'
import Container from '../Container';

interface Props{
  selectedTab: string;
  onTabSelect: (tab: string) => void;
}

const HomeTabBar = ({ selectedTab, onTabSelect }: Props) => {
  return (
    <Container>
      {/* grid layout: 3 columns on mobile, expands on larger screens */}
      <div className='grid grid-cols-3 sm:grid-cols-6 gap-3 items-center'>
        <div className='col-span-3 sm:col-span-5 flex flex-wrap gap-2'>
          <div className="w-full grid grid-cols-3 sm:grid-cols-6 gap-2">
            {productType?.map((item) => {
              const isActive = selectedTab === item?.title;
              return (
                <button
                  key={item?.title}
                  onClick={() => onTabSelect(item?.title)}
                  className={`w-full text-center border rounded-full py-1.5 px-2 text-sm font-medium
                    ${isActive ? 'btn-tab--active' : ''}`}
                  aria-pressed={isActive}
                >
                  {item?.title}
                </button>
              )
            })}
            <Link className='text-center border rounded-full py-1.5 px-4 text-sm font-medium'
          href="/shop"
        >
          See all
        </Link>
          </div>
        </div>

        
      </div>
    </Container>
  )
}

export default HomeTabBar