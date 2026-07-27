import type { Metadata } from 'next'
import VotersClient from './VotersClient'
import { getFilterOptions, getVoters } from './voter-actions'

export const metadata: Metadata = { title: 'Data Pemilih (DPT)' }

export default async function VotersPage() {
  const [initialData, filters] = await Promise.all([getVoters({}), getFilterOptions()])
  return <VotersClient initialData={initialData} filters={filters} />
}
