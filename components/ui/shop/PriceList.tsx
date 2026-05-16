import React from "react";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Label } from "../label";

const priceArray = [
  { title: "Under k100", value: "0-100" },
  { title: "k100 - k200", value: "100-200" },
  { title: "k200 - k300", value: "200-300" },
  { title: "k300 - k500", value: "300-500" },
  { title: "Over k500", value: "500-10000" },
];

interface Props {
  selectedPrice?: string | null;
  setSelectedPrice: React.Dispatch<React.SetStateAction<string | null>>;
}

const PriceList = ({ selectedPrice, setSelectedPrice }: Props) => {
  return (
    <div className="w-full bg-white dark:bg-[#121212] p-5 transition-colors duration-300">
      <h2 className="text-base font-black text-black dark:text-white">Price</h2>

      <RadioGroup className="mt-2 space-y-1" value={selectedPrice || ""}>
        {priceArray?.map((price, index) => (
          <div
            key={index}
            onClick={() => setSelectedPrice(price?.value)}
            className="flex items-center space-x-2 hover:cursor-pointer"
          >
            <RadioGroupItem
              value={price?.value}
              id={price?.value}
              className="rounded-sm"
            />
            <Label
              htmlFor={price.value}
              className={`${
                selectedPrice === price?.value
                  ? "font-semibold text-shop_dark_green"
                  : "font-normal text-gray-700 dark:text-gray-300"
              } transition-colors duration-300`}
            >
              {price?.title}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {selectedPrice && (
        <button
          onClick={() => setSelectedPrice(null)}
          className="text-sm font-medium mt-2 underline underline-offset-2 decoration-[1px] hover:text-shop_dark_green dark:hover:text-shop-golden hoverEffect transition-colors duration-300"
        >
          Reset selection
        </button>
      )}
    </div>
  );
};

export default PriceList;
