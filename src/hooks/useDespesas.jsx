import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { v4 as uuid } from 'uuid'
import {
  envelopeVazio,
  lerDespesas,
  salvarDespesas,
} from '../services/drive'
import { estaAutenticado, assinarAuth } from '../services/auth'
import { toast } from '../services/toast'
import { CATEGORIAS_PADRAO } from '../utils/constantes'
import { calcularSaldo } from '../utils/saldo'

const CACHE_KEY = 'cdj:cache-despesas'
const Contexto = createContext(null)

function lerCache() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (bruto && typeof bruto === 'object') return { ...envelopeVazio(), ...bruto }
  } catch {
    /* cache inválido */
  }
  return null
}

function gravarCache(envelope) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(envelope))
  } catch {
    /* quota cheia — o Drive continua sendo a fonte da verdade */
  }
}

/** Mais recentes primeiro; empate resolvido pelo instante de criação. */
function ordenar(despesas) {
  return [...despesas].sort((a, b) => {
    const porData = String(b.data ?? '').localeCompare(String(a.data ?? ''))
    if (porData !== 0) return porData
    return String(b.criado_em ?? '').localeCompare(String(a.criado_em ?? ''))
  })
}

export function DespesasProvider({ children }) {
  const [envelope, setEnvelope] = useState(() => lerCache() ?? envelopeVazio())
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  /** false enquanto os dados vierem só do cache local. */
  const [sincronizado, setSincronizado] = useState(false)

  // Evita que uma resposta lenta do Drive sobrescreva uma edição mais recente.
  const envelopeRef = useRef(envelope)
  envelopeRef.current = envelope

  const recarregar = useCallback(async ({ silencioso = false } = {}) => {
    if (!estaAutenticado()) {
      setSincronizado(false)
      return null
    }
    if (!silencioso) setCarregando(true)
    try {
      const remoto = await lerDespesas()
      setEnvelope(remoto)
      gravarCache(remoto)
      setSincronizado(true)
      return remoto
    } catch (e) {
      toast.erro(`Não consegui carregar as despesas: ${e.message}`)
      setSincronizado(false)
      return null
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
    return assinarAuth((autenticado) => {
      if (autenticado) recarregar({ silencioso: true })
      else setSincronizado(false)
    })
  }, [recarregar])

  /**
   * Aplica a mudança na UI na hora e grava no Drive em seguida.
   * Se a gravação falhar, desfaz — o usuário nunca fica achando que salvou.
   */
  const persistir = useCallback(async (proximo) => {
    const anterior = envelopeRef.current
    setEnvelope(proximo)
    gravarCache(proximo)
    setSalvando(true)
    try {
      await salvarDespesas(proximo)
      setSincronizado(true)
    } catch (e) {
      setEnvelope(anterior)
      gravarCache(anterior)
      toast.erro(`Não salvou no Drive: ${e.message}`)
      throw e
    } finally {
      setSalvando(false)
    }
  }, [])

  const adicionar = useCallback(
    (dados) => {
      const despesa = {
        id: uuid(),
        data: dados.data,
        local: dados.local,
        valor: Number(dados.valor) || 0,
        categoria: dados.categoria,
        pagador: dados.pagador,
        comprovante_drive_id: dados.comprovante_drive_id ?? null,
        criado_em: new Date().toISOString(),
      }
      const atual = envelopeRef.current
      return persistir({
        ...atual,
        despesas: [despesa, ...atual.despesas],
      }).then(() => despesa)
    },
    [persistir],
  )

  const atualizar = useCallback(
    (id, campos) => {
      const atual = envelopeRef.current
      return persistir({
        ...atual,
        despesas: atual.despesas.map((d) =>
          d.id === id
            ? { ...d, ...campos, valor: Number(campos.valor ?? d.valor) || 0 }
            : d,
        ),
      })
    },
    [persistir],
  )

  const remover = useCallback(
    (id) => {
      const atual = envelopeRef.current
      return persistir({
        ...atual,
        despesas: atual.despesas.filter((d) => d.id !== id),
      })
    },
    [persistir],
  )

  const adicionarCategoria = useCallback(
    ({ emoji, label }) => {
      const atual = envelopeRef.current
      const id = label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      if (!id) return Promise.reject(new Error('Nome de categoria inválido.'))

      const jaExiste = [...CATEGORIAS_PADRAO, ...atual.categorias_custom].some(
        (c) => c.id === id,
      )
      if (jaExiste) return Promise.resolve(id)

      return persistir({
        ...atual,
        categorias_custom: [
          ...atual.categorias_custom,
          { id, emoji: emoji || '📌', label },
        ],
      }).then(() => id)
    },
    [persistir],
  )

  const registrarAcerto = useCallback(
    ({ de, para, valor }) => {
      const atual = envelopeRef.current
      return persistir({
        ...atual,
        acertos: [
          ...atual.acertos,
          {
            id: uuid(),
            de,
            para,
            valor: Number(valor) || 0,
            criado_em: new Date().toISOString(),
          },
        ],
      })
    },
    [persistir],
  )

  const removerAcerto = useCallback(
    (id) => {
      const atual = envelopeRef.current
      return persistir({
        ...atual,
        acertos: atual.acertos.filter((a) => a.id !== id),
      })
    },
    [persistir],
  )

  const valor = useMemo(() => {
    const despesas = ordenar(envelope.despesas)
    return {
      despesas,
      acertos: envelope.acertos,
      categorias: [...CATEGORIAS_PADRAO, ...envelope.categorias_custom],
      saldo: calcularSaldo(despesas, envelope.acertos),
      carregando,
      salvando,
      sincronizado,
      recarregar,
      adicionar,
      atualizar,
      remover,
      adicionarCategoria,
      registrarAcerto,
      removerAcerto,
    }
  }, [
    envelope,
    carregando,
    salvando,
    sincronizado,
    recarregar,
    adicionar,
    atualizar,
    remover,
    adicionarCategoria,
    registrarAcerto,
    removerAcerto,
  ])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useDespesas() {
  const contexto = useContext(Contexto)
  if (!contexto) {
    throw new Error('useDespesas precisa estar dentro de <DespesasProvider>.')
  }
  return contexto
}
