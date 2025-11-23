import { createClient } from "next-sanity";

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.warn("Missing NEXT_PUBLIC_SANITY_PROJECT_ID");
}
if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
  console.warn("Missing NEXT_PUBLIC_SANITY_DATASET");
}
if (!process.env.SANITY_WRITE_TOKEN) {
  console.warn("Missing SANITY_WRITE_TOKEN");
}

export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "",
  apiVersion: "2023-10-01",
  token: process.env.SANITY_WRITE_TOKEN || "",
  useCdn: false,
});
