import React from 'react'
import { Title } from './text'
import Link from 'next/link'
import { unnamed} from '@/images'
import Image from 'next/image'

const HomeBanner = () => {
  return (
    <div className='py-16 px-16 bg-shop-pinkish rounded-lg md:py-0 lg:px-24 flex items-center justify-between'>
      <div className='space-y-5'>
        <Title>Grab up to 50% off on <br/>
        Selected products
        </Title>
        <Link className="bg-shop-dark-yellow/90 text-white/90 px-5 py-2 rounded-md text-sm font-semibold hover:text-white hover:bg-shop-dark-yellow hoverEffect" href={"/shop"}>Buy Now</Link>
      </div>
      <div>
        <Image className="hidden md:inline-flex w-96 rounded-b-md" src={unnamed} alt="banner_1"/>
      </div>
    </div>
  )
}

export default HomeBanner
