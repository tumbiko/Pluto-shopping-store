import Container from './container';
import React from 'react';
import Logo from './Logo';
import HeaderMenu from './HeaderMenu';
import SearchBar from './SearchBar';
import CartIcon from './CartIcon';
import FavoriteButton from './FavoriteButton';
import SignIn from './SignIn';
import MobileMenu from './MobileMenu';
import { currentUser } from '@clerk/nextjs/server';
import { ClerkLoaded, SignedIn, UserButton } from '@clerk/nextjs';

const Header = async () => {
  const user = await currentUser();

  return (
    <header className="bg-white/70 dark:bg-[#121212]/70 px-5 py-2 sticky top-0 z-50 backdrop-blur-md transition-colors duration-300">
      <Container className="flex items-center justify-between text-gray-600 dark:text-gray-300 border-b border-b-black/20 dark:border-b-gray-700 pb-4 pt-4 transition-colors duration-300">
        <div className="w-auto md:w-1/3 flex items-center justify-start md:gap-0 gap-2.5">
          <MobileMenu />
          <Logo className="text-black dark:text-white" />
        </div>

        <HeaderMenu />

        <div className="w-auto md:w-1/3 flex items-center justify-end gap-4">
          {/* Search Bar */}
          <SearchBar/>
          
          <CartIcon />
          <FavoriteButton />
          
          <ClerkLoaded>
            <SignedIn>
              <UserButton />
            </SignedIn>
            {!user && <SignIn />}
          </ClerkLoaded>
        </div>
      </Container>
    </header>
  );
};

export default Header;
