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
  mesclarEnvelopes,
  normalizar,
  salvarDespesas,
} from '../services/drive'
import { estaAutenticado, assinarAuth } from '../services/auth'
import { toast } from '../services/toast'
import { CATEGORIAS_PADRAO } from '../utils/constantes'
import { calcularSaldo } from '../utils/saldo'

const CACHE_KEY = 'cdj:cache-despesas'
const PENDENTE_KEY = 'cdj:pendente'
const Contexto = createContext(null)

function lerCache() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CACHE_KEY))
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
  /** Contador de gravações em voo — `salvando` é derivado. */
  const [emVoo, setEmVoo] = useState(0)
  const salvando = emVoo > 0
  /** false enquanto os dados vierem só do cache local. */
  const [sincronizado, setSincronizado] = useState(false)
  /** true quando há edições feitas offline aguardando envio ao Drive. */
  const [pendente, setPendente] = useState(() => {
    try {
      return localStorage.getItem(PENDENTE_KEY) === '1'
    } catch {
      return false
    }
  })

  // envelopeRef guarda SEMPRE o estado mais recente (inclusive otimista).
  const envelopeRef = useRef(envelope)
  envelopeRef.current = envelope
  const pendenteRef = useRef(pendente)
  pendenteRef.current = pendente

  // Fila única que serializa TODAS as gravações no Drive (persistir + sync).
  const filaRef = useRef(Promise.resolve())

  const iniciarSave = useCallback(() => setEmVoo((n) => n + 1), [])
  const fimSave = useCallback(() => setEmVoo((n) => Math.max(0, n - 1)), [])

  const marcarPendente = useCallback((v) => {
    setPendente(v)
    try {
      if (v) localStorage.setItem(PENDENTE_KEY, '1')
      else localStorage.removeItem(PENDENTE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const recarregar = useCallback(async ({ silencioso = false } = {}) => {
    if (!estaAutenticado()) {
      setSincronizado(false)
      return null
    }
    if (!silencioso) setCarregando(true)
    try {
      const remoto = await lerDespesas()
      // MERGE (local vence) em vez de sobrescrever: uma resposta lenta do Drive
      // nunca descarta uma edição otimista que o usuário acabou de fazer. É união
      // por id — como o outro aparelho é aditivo, traz o que ele adicionou sem
      // apagar o local. (Exclusões remotas não propagam — trade-off aceito.)
      const mesclado = mesclarEnvelopes(remoto, envelopeRef.current)
      setEnvelope(mesclado)
      envelopeRef.current = mesclado
      gravarCache(mesclado)
      setSincronizado(true)
      return mesclado
    } catch (e) {
      // Offline no carregamento: fica em silêncio e usa o cache local.
      if (!e.rede) toast.erro(`Não consegui carregar as despesas: ${e.message}`)
      setSincronizado(false)
      return null
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }, [])

  /**
   * Reenvia as edições feitas offline. Passa pela MESMA fila dos saves (nunca
   * concorre com persistir) e faz read-modify-write com MERGE por id, para não
   * apagar o que o outro aparelho gravou nesse meio-tempo.
   */
  const sincronizarPendente = useCallback(() => {
    if (!estaAutenticado() || !pendenteRef.current) return Promise.resolve()

    const tarefa = filaRef.current.then(async () => {
      if (!pendenteRef.current) return // já sincronizado por outra tarefa
      iniciarSave()
      try {
        const remoto = await lerDespesas()
        const mesclado = mesclarEnvelopes(remoto, envelopeRef.current)
        await salvarDespesas(mesclado)
        setEnvelope(mesclado)
        envelopeRef.current = mesclado
        gravarCache(mesclado)
        marcarPendente(false)
        setSincronizado(true)
        toast.ok('Alterações offline sincronizadas.')
      } catch {
        /* segue pendente; tentamos de novo no próximo 'online' */
      } finally {
        fimSave()
      }
    })
    filaRef.current = tarefa.catch(() => {})
    return tarefa
  }, [marcarPendente, iniciarSave, fimSave])

  useEffect(() => {
    // Se havia edições offline, empurra o local; senão, puxa o remoto.
    if (pendenteRef.current) sincronizarPendente()
    else recarregar()

    const aoVoltar = () => {
      if (pendenteRef.current) sincronizarPendente()
      else recarregar({ silencioso: true })
    }
    window.addEventListener('online', aoVoltar)

    const desassinar = assinarAuth((autenticado) => {
      if (!autenticado) {
        setSincronizado(false)
        return
      }
      if (pendenteRef.current) sincronizarPendente()
      else recarregar({ silencioso: true })
    })

    return () => {
      window.removeEventListener('online', aoVoltar)
      desassinar()
    }
  }, [recarregar, sincronizarPendente])

  /**
   * Aplica a mudança na UI na hora e grava no Drive em seguida.
   *
   * `transformar(atual) => proximo` recebe SEMPRE o estado mais recente. As
   * gravações rodam em fila e cada uma envia o estado mais novo disponível na
   * hora (`alvo`), então se compõem corretamente com o merge do sync. Se falhar
   * por REDE, mantém a edição e marca pendente; por outro motivo, desfaz.
   */
  const persistir = useCallback(
    (transformar) => {
      const anterior = envelopeRef.current
      const proximo = transformar(anterior)
      setEnvelope(proximo)
      envelopeRef.current = proximo
      gravarCache(proximo)

      const tarefa = filaRef.current.then(async () => {
        iniciarSave()
        const alvo = envelopeRef.current
        try {
          // Caminho online: grava o estado inteiro (last-writer-wins). Edições
          // simultâneas dos dois aparelhos são reconciliadas no próximo pull
          // (recarregar faz merge) e no sync pós-offline.
          await salvarDespesas(alvo)
          setSincronizado(true)
          marcarPendente(false)
        } catch (e) {
          if (e.rede) {
            // Offline é "sucesso local": mantém a edição e reenvia depois.
            marcarPendente(true)
            setSincronizado(false)
            return
          }
          if (envelopeRef.current === alvo) {
            setEnvelope(anterior)
            envelopeRef.current = anterior
            gravarCache(anterior)
          }
          toast.erro(`Não salvou no Drive: ${e.message}`)
          throw e
        } finally {
          fimSave()
        }
      })
      filaRef.current = tarefa.catch(() => {})
      return tarefa
    },
    [marcarPendente, iniciarSave, fimSave],
  )

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
      pendente,
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
    pendente,
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
