import Container from '@/components/Container';
import AddToCartButton from '@/components/ui/AddToCartButton';
import FavoriteButton from '@/components/ui/FavoriteButton';
import ImageView from '@/components/ui/ImageView';
import PriceView from '@/components/ui/PriceView';
import TabNavigation from '@/components/ui/TabNavigation';
import { getProductBySlug } from '@/sanity/queries';
import { CornerDownLeft, StarIcon, Truck } from 'lucide-react';
import React from 'react';
import { FaRegQuestionCircle } from 'react-icons/fa';
import { FiShare2 } from 'react-icons/fi';
import { RxBorderSplit } from 'react-icons/rx';
import { TbTruckDelivery } from 'react-icons/tb';
import { notFound } from 'next/navigation';
import { Product } from '@/sanity.types'; // <-- Import your Product type

// Helper type-guard to filter null/undefined and narrow types for TS
function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const SingleProductPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const productRaw = await getProductBySlug(slug);
  if (!productRaw) {
    return notFound();
  }

  // Sanitize arrays that may contain null entries
  // (extend to other array fields if your schema has them)
  const sanitized = {
    ...productRaw,
    categories: Array.isArray(productRaw.categories)
      ? productRaw.categories.filter(notNull)
      : undefined,
    images: Array.isArray(productRaw.images)
      ? productRaw.images.filter(notNull)
      : undefined,
    // if you have tags, variants, options etc. sanitize them here too:
    // tags: Array.isArray(productRaw.tags) ? productRaw.tags.filter(notNull) : undefined,
  };

  // Cast the sanitized object to Product so the UI components expecting Product type are satisfied.
  // This is safe because we've removed null/undefined entries from arrays.
  const product = sanitized as Product;

  return (
    <>
      <Container className="max-w-full flex flex-col md:flex-row gap-10 py-10">
        {product?.images && (
          <ImageView images={product.images} isStock={product?.stock} />
        )}

        <div className="w-full md:w-1/2 flex flex-col gap-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{product?.name}</h2>
            <p className="text-gray-600 text-sm tracking-wide">
              {product?.specifications || 'No specifications available'}
            </p>
            <div className="flex items-center gap-0.5 text-xs">
              {[...Array(5)].map((_, index) => (
                <StarIcon
                  key={index}
                  size={12}
                  className="text-shop-golden/50"
                  fill={'#fb6c08'}
                />
              ))}
              <p className="font-semibold">{`(120)`}</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-b border-gray-200 py-5">
            <PriceView
              price={product?.price}
              discount={product?.discount}
              className="text-lg font-bold"
            />
            <p
              className={`px-4 py-1.5 text-sm text-center inline-block font-semibold rounded-lg ${
                product?.stock === 0
                  ? 'bg-red-100 text-red-600'
                  : 'text-yellow-600 bg-yellow-100'
              }`}
            >
              {(product?.stock as number) > 0 ? 'In Stock' : 'Out of Stock'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 lg:gap-3">
            <AddToCartButton product={product} />
            <FavoriteButton showProduct={true} product={product} />
          </div>

          <p className="text-sm capitalize">
            Variant:{' '}
            <span className="font-semibold">
              {product?.variant ?? 'Default'}
            </span>
          </p>

          <div className="flex flex-wrap items-center cursor-pointer justify-between gap-2.5 border-b border-b-gray-200 py-5 -mt-2">
            <div className="flex items-center gap-2 text-sm text-black hover:text-red-600 hoverEffect">
              <RxBorderSplit className="text-lg" />
              <p>Compare color</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-black hover:text-red-600 hoverEffect">
              <FaRegQuestionCircle className="text-lg" />
              <p>Ask a question</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-black hover:text-red-600 hoverEffect">
              <TbTruckDelivery className="text-lg" />
              <p>Delivery & Return</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-black hover:text-red-600 hoverEffect">
              <FiShare2 className="text-lg" />
              <p>Share</p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="border border-shop-light-bg/25 border-b-0 p-3 flex items-center gap-2.5">
              <Truck size={30} className="text-shop-blue" />
              <div>
                <p className="text-base font-semibold text-black">Free Delivery</p>
                <p className="text-sm text-gray-500 underline underline-offset-2">
                  Enter your Postal code for Delivey Availability.
                </p>
              </div>
            </div>
            <div className="border border-lightColor/25 p-3 flex items-center gap-2.5">
              <CornerDownLeft size={30} className="text-shop-blue" />
              <div>
                <p className="text-base font-semibold text-black">Return Delivery</p>
                <p className="text-sm text-gray-500 ">
                  Free 30days Delivery Returns. <span className="underline underline-offset-2">Details</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <TabNavigation product={product} />
    </>
  );
};

export default SingleProductPage;
