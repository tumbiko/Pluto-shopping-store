import { createClient } from 'next-sanity'

// -----------------------------
// Read-only client (browser-safe)
// -----------------------------
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2023-10-01',
  useCdn: true, // ✅ read-only, safe for frontend
})

// -----------------------------
// Write client (server-only)
// -----------------------------
export const writeClient = createClient({
  projectId: process.env.PROJECT_ID!,
  dataset: process.env.DATASET!,
  apiVersion: '2023-10-01',
  token: process.env.SANITY_API_WRITE_TOKEN!, // ✅ never exposed to frontend
  useCdn: false,
})
