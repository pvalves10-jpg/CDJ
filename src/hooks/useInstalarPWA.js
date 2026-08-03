import { useEffect, useState } from 'react'
import { assinarInstalar, podeInstalar } from '../services/instalar'

/** true quando o navegador (Android/Chrome) permite o instalador nativo. */
export function useInstalarPWA() {
  const [pode, setPode] = useState(podeInstalar)
  useEffect(() => assinarInstalar(() => setPode(podeInstalar())), [])
  return pode
}
