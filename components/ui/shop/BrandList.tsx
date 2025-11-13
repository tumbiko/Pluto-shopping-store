import { BRANDS_QUERYResult } from '@/sanity.types';
import React from 'react'
import { RadioGroup, RadioGroupItem } from '../radio-group';
import { Label } from '../label';

interface Props {
  brands: BRANDS_QUERYResult;
  selectedBrand?: string | null;
  setSelectedBrand: React.Dispatch<React.SetStateAction<string | null>>;
}

const BrandList = ({ brands, selectedBrand, setSelectedBrand }: Props) => {
  return (
    <div className="w-full bg-white dark:bg-[#121212] p-5 transition-colors duration-300">
      <h2 className="text-base font-black text-black dark:text-white">Brand Categories</h2>

      <RadioGroup value={selectedBrand || ""} className="mt-2 space-y-1">
        {brands?.map((brand) => (
          <div
            key={brand?._id}
            onClick={() => setSelectedBrand(brand?.slug?.current as string)}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <RadioGroupItem
              value={brand?.slug?.current as string}
              id={brand?.slug?.current}
              className="rounded-sm cursor-pointer"
            />
            <Label
              htmlFor={brand?.slug?.current}
              className={`${
                selectedBrand === brand?.slug?.current
                  ? "font-semibold text-shop_dark_green"
                  : "font-normal text-gray-700 dark:text-gray-300"
              } transition-colors duration-300`}
            >
              {brand?.title}
            </Label>
          </div>
        ))}

        {selectedBrand && (
          <button
            onClick={() => setSelectedBrand(null)}
            className="text-sm font-medium mt-2 underline underline-offset-2 decoration-[1px] hover:text-shop-dark-yellow dark:hover:text-shop-golden hoverEffect text-left transition-colors duration-300"
          >
            Reset selection
          </button>
        )}
      </RadioGroup>
    </div>
  )
}

export default BrandList;
