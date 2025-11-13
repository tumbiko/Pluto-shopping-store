"use client";
import React from 'react';
import { headerData } from '../../constants/data';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const HeaderMenu = () => {
  const pathname = usePathname();

  return (
    <div className="antialiased hidden md:inline-flex gap-6 w-1/3 items-center justify-center text-gray-600 dark:text-gray-300 text-sm capitalize font-medium transition-colors duration-300">
      {headerData?.map((item) => (
        <Link
          key={item?.name}
          href={item?.href}
          className={`
            relative group hover:text-shop-yellow dark:hover:text-shop-golden hoverEffect transition-colors duration-300
            ${pathname === item?.href ? "text-shop-yellow dark:text-shop-golden font-bold" : ""}
          `}
        >
          {item?.name}
          
          {/* Left underline */}
          <span className={`
            absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-shop-yellow dark:bg-shop-golden 
            group-hover:w-1/2 hoverEffect group-hover:left-0 border-r-4
            ${pathname === item?.href ? "w-1/2" : ""}
          `}/>

          {/* Right underline */}
          <span className={`
            absolute -bottom-0.5 right-1/2 w-0 h-0.5 bg-shop-yellow dark:bg-shop-golden 
            group-hover:w-1/2 hoverEffect group-hover:right-0
            ${pathname === item?.href ? "w-1/2" : ""}
          `}/>
        </Link>
      ))}
    </div>
  );
};

export default HeaderMenu;
