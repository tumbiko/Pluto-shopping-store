"use client";
import React, { useState } from "react";
import Container from "../Container";

type Review = {
  _id?: string;
  author?: string;
  rating?: number;
  text?: string;
  createdAt?: string;
};

type ProductForTabs = {
  description?: PortableBlock[] | string | null;
  additionalInfo?: Record<string, string> | string | null;
  reviews?: Review[] | null;
};

interface Props {
  product?: ProductForTabs | null;
}

/* Minimal Portable Text block typing used for simple text extraction */
type PortableChild = { text?: string };
type PortableBlock = {
  _key?: string;
  children?: PortableChild[] | null;
  text?: string | null;
};

const renderPortableText = (blocks?: PortableBlock[] | null) => {
  if (!Array.isArray(blocks)) return null;
  return blocks.map((block: PortableBlock, idx: number) => {
    const text =
      Array.isArray(block?.children) && block.children.length
        ? block.children.map((c) => c?.text ?? "").join("")
        : block?.text ?? "";
    return (
      <p key={block._key ?? idx} className="mb-3">
        {text}
      </p>
    );
  });
};

type TabKey = "description" | "additional" | "reviews";

const TabNavigation = ({ product }: Props) => {
  const [active, setActive] = useState<TabKey>("description");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "description", label: "Description" },
    { key: "additional", label: "Additional Information" },
    { key: "reviews", label: `Reviews (${product?.reviews?.length ?? 0})` },
  ];

  return (
    <Container>
      <section className="w-full mt-8">
        <div className="border-t pt-6">
          {/* Tab buttons container */}
          <nav className="flex gap-2 mb-6 p-1 rounded-md overflow-hidden bg-gray-100 max-w-3xl">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`flex-1 text-sm font-semibold py-1.5 transition-colors duration-200 ${
                  active === tab.key ? "bg-white text-black " : "text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div className="min-h-[120px">
            {active === "description" && (
              <div className="prose max-w-none text-sm text-gray-700">
                {typeof product?.description === "string" ? (
                  <p>{product.description}</p>
                ) : (
                  renderPortableText(product?.description as PortableBlock[] | null)
                )}
              </div>
            )}

            {active === "additional" && (
              <div className="text-sm text-gray-700">
                {typeof product?.additionalInfo === "string" ? (
                  <p>{product.additionalInfo}</p>
                ) : product?.additionalInfo ? (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {Object.entries(product.additionalInfo as Record<string, string>).map(
                      ([k, v]) => (
                        <div key={k} className="py-1">
                          <dt className="font-medium text-gray-600 capitalize">
                            {k.replace(/[_-]/g, " ")}
                          </dt>
                          <dd className="text-gray-800">{v}</dd>
                        </div>
                      )
                    )}
                  </dl>
                ) : (
                  <p className="text-gray-500">No additional information available.</p>
                )}
              </div>
            )}

            {active === "reviews" && (
              <div className="space-y-4">
                {product?.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((r) => (
                    <div
                      key={r._id ?? `${r.author}-${r.createdAt}`}
                      className="border rounded-md p-4 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">
                            {r.author ?? "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                        <div className="text-sm text-yellow-500 font-semibold">
                          {Array.from({
                            length: Math.max(0, Math.round(r.rating ?? 0)),
                          }).map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{r.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No reviews yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </Container>
  );
};

export default TabNavigation;