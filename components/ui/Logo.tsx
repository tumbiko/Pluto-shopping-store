import { cn } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';

const Logo = ({className}: {className?: string}) => {
  return (
    <Link href="/" className='inline-flex'>
        <h2 className={cn("text-2xl text-shop-dark-yellow font-black tracking-wider uppercase hover:text-amber-300 hoverEffect group",className)}>PlutoShop
            <span className="text-shop-yellow group-hover:text-shop-dark-yellow hoverEffect"></span>
        </h2>
    </Link>
  )
};

export default Logo;
