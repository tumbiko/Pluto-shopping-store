import { createClient } from "next-sanity";

export const writeClient = createClient({
  projectId: process.env.PROJECT_ID!,
  dataset: process.env.DATASET!,
  apiVersion: "2023-10-01",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});
