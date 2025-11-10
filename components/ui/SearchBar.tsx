"use client"
import React, { useEffect, useRef, useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import { client } from "@/sanity/lib/client"
import Link from "next/link"
import Image from "next/image"
import Fuse, { IFuseOptions } from "fuse.js"

interface Product {
  _id: string
  name: string
  slug: { current: string }
  price: number
  imageUrl?: string
  description?: string
  category?: { name?: string }
}

const SearchBar = () => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false) // mobile open state
  const [allProducts, setAllProducts] = useState<Product[]>([])

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Fetch all products once on mount (fields needed for search/display)
  useEffect(() => {
    let mounted = true
    ;(async () => {
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
        )
        if (mounted) setAllProducts(products || [])
      } catch (err) {
        console.error("Failed to load products for search:", err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Build Fuse instance when products arrive
  const fuse = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return null
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
    }
    return new Fuse(allProducts, options)
  }, [allProducts])

  // Debounced query -> search locally via Fuse
  useEffect(() => {
    const delay = setTimeout(() => {
      const q = query.trim()
      if (q.length === 0) {
        setResults([])
        setLoading(false)
        return
      }
      performLocalSearch(q)
    }, 400)
    return () => clearTimeout(delay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const performLocalSearch = (searchText: string) => {
    setLoading(true)
    try {
      if (!fuse) {
        setResults([])
        setLoading(false)
        return
      }
      const fuseRes = fuse.search(searchText, { limit: 10 })
      const mapped = fuseRes.map((r) => r.item)
      setResults(mapped)
    } catch (err) {
      console.error("Fuse search error:", err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // click outside to close (only matters for mobile open)
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!open) return
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleDocClick)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleDocClick)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [open])

  // autofocus when mobile search opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // helper to clear & blur (used when clicking a result)
  const clearAndClose = () => {
    setQuery("")
    setResults([])
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* MOBILE: icon button (visible only < sm) */}
      <button
        type="button"
        className="sm:hidden p-2 rounded-full bg-transparent inline-flex items-center justify-center"
        onClick={() => setOpen(true)}
        aria-label="Open search"
      >
        <Search className="w-5 h-5 text-gray-600" />
      </button>

      {/* DESKTOP: full search visible from sm and up */}
      <div className="hidden sm:flex items-center bg-white border rounded-full px-3 py-1 w-64 lg:w-70">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent outline-none w-full"
        />
      </div>

      {/* MOBILE: expanded search (full width) when open */}
      {open && (
        <div className="sm:hidden fixed left-4 right-4 top-4 z-50">
          <div className="flex items-center bg-white border rounded-full px-3 py-1 w-full shadow">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none w-full"
            />
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setQuery("")
                setResults([])
              }}
              aria-label="Close search"
              className="ml-2 p-1 rounded"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Results panel under the mobile search */}
          <div className="mt-2 w-full bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
            {loading ? (
              <p className="p-3 text-sm text-gray-500">Searching...</p>
            ) : query && results.length > 0 ? (
              results.map((product) => (
                <Link
                  key={product._id}
                  href={`/product/${product.slug.current}`}
                  className="flex items-center p-3 hover:bg-gray-100"
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
                    <p className="text-sm font-medium text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500">K {product.price}</p>
                  </div>
                </Link>
              ))
            ) : query ? (
              <p className="p-3 text-sm text-gray-500">No products found.</p>
            ) : (
              <p className="p-3 text-sm text-gray-500">Start typing to search...</p>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP results dropdown */}
      {query && (
        <div className="hidden sm:block absolute top-full mt-2 left-0 w-64 lg:w-96 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {loading ? (
            <p className="p-3 text-sm text-gray-500">Searching...</p>
          ) : results.length > 0 ? (
            results.map((product) => (
              <Link
                key={product._id}
                href={`/product/${product.slug.current}`}
                className="flex items-center p-3 hover:bg-gray-100"
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
                  <p className="text-sm font-medium text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-500">K {product.price}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="p-3 text-sm text-gray-500">No products found.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
