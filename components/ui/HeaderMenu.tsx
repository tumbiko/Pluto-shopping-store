"use client";
import React, { use } from 'react';
import { headerData } from '../../constants/data';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HeaderMenu = () => {
  //pathname
  const pathname = usePathname();
  
  return (
    <div className='antialiased hidden md:inline-flex gap-6 w-1/3 items-center justify-center text-gray-600 text-sm capitalize font-medium'>
      {headerData?.map((item) =>(
        <Link
          key={item?.name}
          href={item?.href}
          className={`hover:text-shop-yellow hoverEffect relative group ${pathname === item?.href && "text-shop-yellow font-bold"}`}
        >
        {item?.name}
        <span className={`absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-shop-yellow group-hover:w-1/2 hoverEffect group-hover:left-0 border-r-4
          ${pathname === item?.href && "w-1/2"}`}/>
        <span className={`absolute -bottom-0.5 right-1/2 w-0 h-0.5 bg-shop-yellow group-hover:w-1/2 hoverEffect group-hover:right-0
          ${pathname === item?.href && "w-1/2"}`}/>
        </Link>
      ))}
    </div>
  )
};

export default HeaderMenu;
