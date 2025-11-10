import React, { FC } from 'react';
import Logo from './Logo';
import { X } from 'lucide-react';
import Link from 'next/link';
import { headerData } from '@/constants/data';
import { usePathname } from 'next/navigation';
import SocialMedia from './SocialMedia';
import { useOutsideClick } from '@/hooks';

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu: FC<SideBarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const sidebarRef = useOutsideClick<HTMLDivElement>(onClose);

  return (
    <div
      className={`fixed inset-0 z-50 text-white transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div
        ref={sidebarRef}
        className='h-screen w-[77%] max-w-4xl bg-black p-10 flex flex-col gap-6'
      >
        {/* Header */}
        <div className='flex items-center justify-between gap-5'>
          <Logo className='text-white hover:text-yellow-400' />
          <button onClick={onClose} className='hover:text-yellow-400'>
            <X />
          </button>
        </div>

        {/* Navigation Links */}
        <div className='flex flex-col gap-6 text-lg font-semibold tracking-wide mt-10'>
          {headerData?.map((item) => (
            <Link
              href={item?.href}
              key={item?.name}
              onClick={onClose} // ✅ Close sidebar when link clicked
              className={`hover:text-yellow-400 ${
                pathname === item?.href ? 'text-yellow-400' : ''
              }`}
            >
              {item?.name}
            </Link>
          ))}
        </div>

        {/* Social Media */}
        <SocialMedia />
      </div>
    </div>
  );
};

export default SideMenu;
