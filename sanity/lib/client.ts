import { createClient } from 'next-sanity'

// FRONTEND client (browser-safe)
import { projectId, dataset, apiVersion } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})
