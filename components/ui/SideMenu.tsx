import React, { FC, useState, useEffect } from 'react';
import Logo from './Logo';
import { X, Sun, Moon } from 'lucide-react';
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

  const [isDark, setIsDark] = useState(false);

  // Optional: persist theme in localStorage
  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 text-white transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div
        ref={sidebarRef}
        className='h-screen w-[77%] max-w-4xl bg-black p-10 flex flex-col gap-6 relative'
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
              onClick={onClose}
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

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className='absolute bottom-10 right-10 p-2 text-black rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center'
        >
          {isDark ? <Sun className='w-5 h-5 text-yellow-400' /> : <Moon className='w-5 h-5' />}
        </button>
      </div>
    </div>
  );
};

export default SideMenu;
