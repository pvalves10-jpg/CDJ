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
  normalizar,
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
    // Passa pela mesma normalização do Drive: garante o formato canônico
    // (inclusive as três subchaves de `guia`) mesmo em cache de versão antiga.
    if (bruto && typeof bruto === 'object') return normalizar(bruto)
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

/** Sempre devolve `guia` com as três subchaves, mesmo se vier parcial/ausente. */
function guiaSeguro(env) {
  const g = env.guia ?? {}
  return {
    fotos_spots: g.fotos_spots ?? {},
    experiencias: g.experiencias ?? {},
    roteiro: g.roteiro ?? {},
  }
}

export function DespesasProvider({ children }) {
  const [envelope, setEnvelope] = useState(() => lerCache() ?? envelopeVazio())
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  /** false enquanto os dados vierem só do cache local. */
  const [sincronizado, setSincronizado] = useState(false)

  // envelopeRef guarda SEMPRE o estado mais recente (inclusive otimista, ainda
  // não confirmado no Drive). É atualizado no render e, sincronamente, em cada
  // mutação — para que gravações encadeadas partam do estado certo.
  const envelopeRef = useRef(envelope)
  envelopeRef.current = envelope

  // Fila de gravações no Drive: serializa os saves para o último estado gravado
  // ser sempre o mais novo (evita PUTs fora de ordem sobrescrevendo dados).
  const filaRef = useRef(Promise.resolve())

  const recarregar = useCallback(async ({ silencioso = false } = {}) => {
    if (!estaAutenticado()) {
      setSincronizado(false)
      return null
    }
    if (!silencioso) setCarregando(true)
    try {
      const remoto = await lerDespesas()
      setEnvelope(remoto)
      envelopeRef.current = remoto
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
   *
   * `transformar(atual) => proximo` recebe SEMPRE o estado mais recente, então
   * mutações concorrentes não se sobrescrevem. As gravações no Drive rodam em
   * fila (serializadas). Se a gravação falhar, desfaz — a menos que uma mutação
   * mais nova já tenha entrado por cima (aí só avisa o erro).
   */
  const persistir = useCallback((transformar) => {
    const anterior = envelopeRef.current
    const proximo = transformar(anterior)
    setEnvelope(proximo)
    envelopeRef.current = proximo
    gravarCache(proximo)

    const tarefa = filaRef.current.then(async () => {
      setSalvando(true)
      try {
        await salvarDespesas(proximo)
        setSincronizado(true)
      } catch (e) {
        if (envelopeRef.current === proximo) {
          setEnvelope(anterior)
          envelopeRef.current = anterior
          gravarCache(anterior)
        }
        toast.erro(`Não salvou no Drive: ${e.message}`)
        throw e
      } finally {
        setSalvando(false)
      }
    })
    // .catch mantém a fila viva mesmo quando uma gravação falha.
    filaRef.current = tarefa.catch(() => {})
    return tarefa
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
      return persistir((atual) => ({
        ...atual,
        despesas: [despesa, ...atual.despesas],
      })).then(() => despesa)
    },
    [persistir],
  )

  const atualizar = useCallback(
    (id, campos) =>
      persistir((atual) => ({
        ...atual,
        despesas: atual.despesas.map((d) =>
          d.id === id
            ? { ...d, ...campos, valor: Number(campos.valor ?? d.valor) || 0 }
            : d,
        ),
      })),
    [persistir],
  )

  const remover = useCallback(
    (id) =>
      persistir((atual) => ({
        ...atual,
        despesas: atual.despesas.filter((d) => d.id !== id),
      })),
    [persistir],
  )

  const adicionarCategoria = useCallback(
    ({ emoji, label }) => {
      const id = label
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      if (!id) return Promise.reject(new Error('Nome de categoria inválido.'))

      const existentes = [
        ...CATEGORIAS_PADRAO,
        ...envelopeRef.current.categorias_custom,
      ]
      if (existentes.some((c) => c.id === id)) return Promise.resolve(id)

      return persistir((atual) => ({
        ...atual,
        categorias_custom: [
          ...atual.categorias_custom,
          { id, emoji: emoji || '📌', label },
        ],
      })).then(() => id)
    },
    [persistir],
  )

  const registrarAcerto = useCallback(
    ({ de, para, valor }) =>
      persistir((atual) => ({
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
      })),
    [persistir],
  )

  const removerAcerto = useCallback(
    (id) =>
      persistir((atual) => ({
        ...atual,
        acertos: atual.acertos.filter((a) => a.id !== id),
      })),
    [persistir],
  )

  /* --------------------------------------------------------------- guia */

  const marcarExperiencia = useCallback(
    (id, feito) =>
      persistir((atual) => {
        const guia = guiaSeguro(atual)
        const experiencias = { ...guia.experiencias }
        if (feito) experiencias[id] = true
        else delete experiencias[id]
        return { ...atual, guia: { ...guia, experiencias } }
      }),
    [persistir],
  )

  const marcarParada = useCallback(
    (id, feito) =>
      persistir((atual) => {
        const guia = guiaSeguro(atual)
        const roteiro = { ...guia.roteiro }
        if (feito) roteiro[id] = true
        else delete roteiro[id]
        return { ...atual, guia: { ...guia, roteiro } }
      }),
    [persistir],
  )

  const adicionarFotosSpot = useCallback(
    (spotId, fileIds) =>
      persistir((atual) => {
        const guia = guiaSeguro(atual)
        const anteriores = guia.fotos_spots[spotId] ?? []
        const combinados = [
          ...new Set([...anteriores, ...fileIds.filter(Boolean)]),
        ]
        return {
          ...atual,
          guia: {
            ...guia,
            fotos_spots: { ...guia.fotos_spots, [spotId]: combinados },
          },
        }
      }),
    [persistir],
  )

  const removerFotoSpot = useCallback(
    (spotId, fileId) =>
      persistir((atual) => {
        const guia = guiaSeguro(atual)
        const restantes = (guia.fotos_spots[spotId] ?? []).filter(
          (x) => x !== fileId,
        )
        const fotos_spots = { ...guia.fotos_spots }
        if (restantes.length) fotos_spots[spotId] = restantes
        else delete fotos_spots[spotId]
        return { ...atual, guia: { ...guia, fotos_spots } }
      }),
    [persistir],
  )

  const valor = useMemo(() => {
    const despesas = ordenar(envelope.despesas)
    return {
      despesas,
      acertos: envelope.acertos,
      categorias: [...CATEGORIAS_PADRAO, ...envelope.categorias_custom],
      saldo: calcularSaldo(despesas, envelope.acertos),
      guia: guiaSeguro(envelope),
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
      marcarExperiencia,
      marcarParada,
      adicionarFotosSpot,
      removerFotoSpot,
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
    marcarExperiencia,
    marcarParada,
    adicionarFotosSpot,
    removerFotoSpot,
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
