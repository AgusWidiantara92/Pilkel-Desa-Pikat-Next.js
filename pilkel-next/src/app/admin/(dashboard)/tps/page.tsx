import TpsClient from './TpsClient'
import { getTpsList } from './tps-actions'

export default async function TpsPage() {
  const tpsList = await getTpsList()
  return <TpsClient initialData={tpsList} />
}
