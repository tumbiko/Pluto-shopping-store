import React from 'react'
import FooterTop from './FooterTop'
import Container from './Container'
import Logo from './ui/Logo'
import SocialMedia from './ui/SocialMedia'
import { SubText, SubTitle } from './ui/text'
import { categoriesData, quickLinksData } from '@/constants/data'
import Link from 'next/link'
import { Input } from './ui/input'
import { Button } from './ui/button'

const Footer = () => {
  return (
    <footer className='bg-white border-t mt-10'>
      <Container>
        <FooterTop/>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12'>
          {/* Additional footer content can go here */}
          <div className='space-y-4'>
            <Logo/>
            <SubText>Discover curated furniture collections at Pluto shopping store, blending style and comport to elevate your living spaces  </SubText>
            <SocialMedia iconClassName="border-black/60 hover:border-shop-dark-yellow hover:text-shop-dark-yellow" tooltipClassName="bg-black text-white" className='text-black/60'/>
          </div>
          <div>
            <SubTitle>
              Quick Links
            </SubTitle>
            <ul className='mt-4 space-y-3 text-gray-600 capitalize'>
              {quickLinksData?.map((item)=>(
                <li key={item?.name}>
                  <Link href={item?.href} className='hover:text-shop-dark-yellow hover:underline underline-offset-2 hoverEffect'>
                  {item?.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SubTitle>
              Categories
            </SubTitle>
            <ul className='mt-4 space-y-3 text-gray-600 capitalize'>
              {categoriesData?.map((item)=>(
                <li key={item?.name}>
                  <Link href={`/category/${item?.href}`} className='hover:text-shop-dark-yellow hover:underline underline-offset-2 hoverEffect'>
                  {item?.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className='space-y-4'>
            <SubTitle>Newsletter</SubTitle>
            <SubText>Subscribe to our newsletter to get the latest updates on new products and upcoming sales</SubText>
            <form className='space-y-3'>
              <Input
  type="email"
  placeholder="Enter your email"
  className="
    w-full rounded-xl border border-gray-300 
    px-4 py-2 text-gray-700 placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-shop-dark-yellow focus:border-shop-dark-yellow
    transition-all duration-300 ease-in-out
    hover:border-gray-400
  " required/>

              <Button className='w-full'>Subscribe Now</Button>
            </form>
          </div>
        </div>
        <div className="py-6 border-t text-center text-sm text-gray-600">
          <div>
            © {new Date().getFullYear()} <Logo className="text-sm" />. All
            rights reserved.
          </div>
        </div>
      </Container>
      
    </footer>
  )
}

export default Footer