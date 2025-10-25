import { twMerge } from "tailwind-merge";

interface Props {
  amount: number | undefined | null;
  className?: string;
  /** optional: show the currency code (e.g. "MWK") instead of the locale symbol */
  showCurrencyCode?: boolean;
}

const PriceFormatter = ({ amount, className, showCurrencyCode }: Props) => {
  if (amount == null) return (
    <span className={twMerge("text-sm font-semibold text-darkColor", className)}>
      -
    </span>
  );

  // Use en-MW locale and MWK currency
  /*const formattedPrice = new Intl.NumberFormat("en-MW", {
    style: "currency",
    currency: "MWK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    // currencyDisplay: "symbol" // default; use "code" to show "MWK" instead
  }).format(Number(amount)); */

  // Optional: if you prefer a local "K" prefix (e.g. "K 1,234.00") rather than the Intl currency symbol,
  // you can uncomment the alternative below:
  const formattedPrice = `K ${Number(amount).toLocaleString("en-MW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <span className={twMerge("text-sm font-semibold text-darkColor", className)}>
      {showCurrencyCode
        ? // show currency code like "MWK 1,234.00"
          `MWK ${Number(amount).toLocaleString("en-MW", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : formattedPrice}
    </span>
  );
};

export default PriceFormatter;
