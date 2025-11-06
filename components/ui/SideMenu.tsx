import React, { FC} from 'react'
import Logo from './Logo';
import { X } from 'lucide-react';
import Link from 'next/link'
import { headerData } from '@/constants/data';
import { usePathname } from 'next/navigation';
import SocialMedia from './SocialMedia';
import { useOutsideClick } from '@/hooks';

interface SideBarProps{
    isOpen: boolean;
    onClose: () => void;
}

const SideMenu:FC<SideBarProps> = ({isOpen,onClose}) => {
    const pathname = usePathname();
    const sidebarRef = useOutsideClick<HTMLDivElement>(onClose); 
  return (
    <div className={`fixed inset-y-0 text-white/80 h-screen left-0 z-50 w-full bg-black/50 shadow-xl
    ${
        isOpen ? "translate-x-0":"-translate-x-full"
    } hoverEffect`}>
      <div ref={sidebarRef} className=' min-w-72 max-w-96 bg-black h-screen p-10 border-r-shop-yellow flex flex-col gap-6'>
        <div className='flex items-center justify-between gap-5'>
            <Logo className='text-white hover:text-shop-dark-yellow'/>
            <button onClick={onClose} className='hover:text-shop-dark-yellow hoverEffect'>
                <X/>

            </button>
        </div>
        <div className='flex flex-col gap-6 text-lg font-semibold tracking-wide mt-10'>
            {headerData?.map((item)=>(
                <Link href={item?.href} key={item?.name} className={`hover:text-shop-dark-yellow hoverEffect ${
                    pathname === item?.href && "text-shop-dark-yellow"
                }`}>
                {item?.name}
                </Link>

            ))}
        </div>
        <SocialMedia/>
      </div>
    </div>
  )
}

export default SideMenu

