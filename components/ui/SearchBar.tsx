"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { client } from "@/sanity/lib/client";
import Link from "next/link";
import Image from "next/image";
import Fuse, { IFuseOptions } from "fuse.js";

interface Product {
  _id: string;
  name: string;
  slug: { current: string };
  price: number;
  imageUrl?: string;
  description?: string;
  category?: { name?: string };
}

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const products = await client.fetch<Product[]>(
          `*[_type == "product"]{
            _id,
            name,
            slug,
            price,
            description,
            "imageUrl": images[0].asset->url,
            "category": category->{name}
          }`
        );
        if (mounted) setAllProducts(products || []);
      } catch (err) {
        console.error("Failed to load products for search:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fuse = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return null;
    const options: IFuseOptions<Product> = {
      keys: [
        { name: "name", weight: 0.6 },
        { name: "category.name", weight: 0.2 },
        { name: "description", weight: 0.2 },
      ],
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    };
    return new Fuse(allProducts, options);
  }, [allProducts]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const q = query.trim();
      if (q.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }
      performLocalSearch(q);
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const performLocalSearch = (searchText: string) => {
    setLoading(true);
    try {
      if (!fuse) {
        setResults([]);
        setLoading(false);
        return;
      }
      const fuseRes = fuse.search(searchText, { limit: 10 });
      setResults(fuseRes.map((r) => r.item));
    } catch (err) {
      console.error("Fuse search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
        setDesktopOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setDesktopOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    if (mobileOpen || desktopOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mobileOpen, desktopOpen]);

  const clearAndClose = () => {
    setQuery("");
    setResults([]);
    setMobileOpen(false);
    setDesktopOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={wrapperRef} className="relative flex items-center">
      {/* MOBILE: icon button */}
      <button
        type="button"
        className="sm:hidden p-2 rounded-full bg-transparent inline-flex items-center justify-center"
        onClick={() => setMobileOpen(true)}
        aria-label="Open search"
      >
        <Search className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors duration-300" />
      </button>

      {/* SMALL screens */}
      <div className="hidden sm:flex md:hidden items-center bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1 w-64 lg:w-70 transition-colors duration-300">
        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 transition-colors duration-300" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent outline-none w-full text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
        />
      </div>

      {/* MD & UP: toggle icon */}
      <div className="hidden md:flex items-center">
        <button
          type="button"
          className="p-2 rounded-full bg-transparent inline-flex items-center justify-center"
          onClick={() => setDesktopOpen((s) => !s)}
          aria-label="Toggle search"
        >
          <Search className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors duration-300" />
        </button>
      </div>

      {/* MD+ dropdown */}
      {desktopOpen && (
        <div className="hidden md:block absolute top-full right-0 mt-2 translate-y-2 z-50">
          <div className="min-w-[450px] max-w-sm w-80 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden transition-colors duration-300">
            <div className="flex items-center px-3 py-2 border-b border-gray-300 dark:border-gray-700 transition-colors duration-300">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 transition-colors duration-300" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
              />
              <button type="button" onClick={clearAndClose} aria-label="Close search" className="ml-2 p-1 rounded">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors duration-300" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {query ? (
                loading ? (
                  <p className="p-3 text-sm text-gray-500 dark:text-gray-300 transition-colors duration-300">Searching...</p>
                ) : results.length > 0 ? (
                  results.map((product) => (
                    <Link
                      key={product._id}
                      href={`/product/${product.slug.current}`}
                      className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                      onClick={clearAndClose}
                    >
                      {product.imageUrl && (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded mr-3"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors duration-300">{product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">K {product.price}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="p-3 text-sm text-gray-500 dark:text-gray-300 transition-colors duration-300">No products found.</p>
                )
              ) : (
                <p className="p-3 text-sm text-gray-500 dark:text-gray-300 transition-colors duration-300">Start typing to search...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE expanded search */}
      {mobileOpen && (
        <div className="sm:hidden fixed left-4 right-4 top-4 z-50">
          <div className="flex items-center bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-full px-3 py-1 w-full shadow transition-colors duration-300">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 transition-colors duration-300" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
            />
            <button type="button" onClick={clearAndClose} aria-label="Close search" className="ml-2 p-1 rounded">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors duration-300" />
            </button>
          </div>

          <div className="mt-2 w-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-y-auto transition-colors duration-300">
            {loading ? (
              <p className="p-3 text-sm text-gray-500 dark:text-gray-300 transition-colors duration-300">Searching...</p>
            ) : query && results.length > 0 ? (
              results.map((product) => (
                <Link
                  key={product._id}
                  href={`/product/${product.slug.current}`}
                  className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                  onClick={clearAndClose}
                >
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded mr-3"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors duration-300">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">K {product.price}</p>
                  </div>
                </Link>
              ))
            ) : query ? (
              <p className="p-3 text-sm text-gray-500 dark:text-gray-300 transition-colors duration-300">No products found.</p>
            ) : (
              <p className="p-3 text-sm text-gray-500 dark:text-gray-300 transition-colors duration-300">Start typing to search...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
