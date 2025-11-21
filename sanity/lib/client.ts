import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
})
export const writeClient = createClient({
  projectId: projectId, // ❗ use the same imported value, not NEXT_PUBLIC_
  dataset: dataset,
  apiVersion: '2023-10-01',
  token: process.env.SANITY_API_WRITE_TOKEN, // must be set on Vercel
  useCdn: false,
});
