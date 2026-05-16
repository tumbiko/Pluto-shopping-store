import React from 'react';
import FooterTop from './FooterTop';
import Container from './Container';
import Logo from './ui/Logo';
import SocialMedia from './ui/SocialMedia';
import { SubText, SubTitle } from './ui/text';
import { categoriesData, quickLinksData } from '@/constants/data';
import Link from 'next/link';
import { Input } from './ui/input';
import { Button } from './ui/button';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-gray-700 mt-10 transition-colors duration-300">
      <Container>
        <FooterTop />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12 text-gray-700 dark:text-gray-300 transition-colors duration-300">
          {/* About / Logo Section */}
          <div className="space-y-4">
            <Logo className="text-black dark:text-white" />
            <SubText className="text-gray-600 dark:text-gray-400">
              Discover curated furniture collections at Pluto shopping store, blending style and comfort to elevate your living spaces.
            </SubText>
            <SocialMedia
              iconClassName="border-black/60 dark:border-gray-400 hover:border-shop-dark-yellow dark:hover:border-shop-golden hover:text-shop-dark-yellow dark:hover:text-shop-golden"
              tooltipClassName="bg-black dark:bg-gray-800 text-white"
              className="text-black/60 dark:text-gray-400"
            />
          </div>

          {/* Quick Links */}
          <div>
            <SubTitle className="text-black dark:text-white">Quick Links</SubTitle>
            <ul className="mt-4 space-y-3 text-gray-600 dark:text-gray-400 capitalize">
              {quickLinksData?.map((item) => (
                <li key={item?.name}>
                  <Link
                    href={item?.href}
                    className="hover:text-shop-dark-yellow dark:hover:text-shop-golden hover:underline underline-offset-2 transition-colors duration-300"
                  >
                    {item?.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <SubTitle className="text-black dark:text-white">Categories</SubTitle>
            <ul className="mt-4 space-y-3 text-gray-600 dark:text-gray-400 capitalize">
              {categoriesData?.map((item) => (
                <li key={item?.name}>
                  <Link
                    href={`/category/${item?.href}`}
                    className="hover:text-shop-dark-yellow dark:hover:text-shop-golden hover:underline underline-offset-2 transition-colors duration-300"
                  >
                    {item?.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <SubTitle className="text-black dark:text-white">Newsletter</SubTitle>
            <SubText className="text-gray-600 dark:text-gray-400">
              Subscribe to our newsletter to get the latest updates on new products and upcoming sales.
            </SubText>

            <form className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="
                  w-full rounded-xl border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-[#1a1a1a]
                  px-4 py-2 text-gray-700 dark:text-gray-200
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-shop-dark-yellow dark:focus:ring-shop-golden
                  focus:border-shop-dark-yellow dark:focus:border-shop-golden
                  transition-all duration-300 ease-in-out
                  hover:border-gray-400 dark:hover:border-gray-500
                "
                required
              />

              <Button className="w-full bg-shop-dark-yellow hover:bg-shop-golden dark:bg-shop-golden dark:hover:bg-yellow-500 text-black font-medium transition-all duration-300">
                Subscribe Now
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="py-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
          <div>
            © {new Date().getFullYear()} <Logo className="inline text-sm text-black dark:text-white" />. All
            rights reserved.
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
