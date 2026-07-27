import type { Metadata } from 'next'
import TpsClient from './TpsClient'
import { getTpsList } from './tps-actions'

export const metadata: Metadata = { title: 'Data TPS' }

export default async function TpsPage() {
  const tpsList = await getTpsList()
  return <TpsClient initialData={tpsList} />
}
