import { useMemo, useState } from 'react'
import ResumoSaldo from './ResumoSaldo'
import Cartao from '../ui/Cartao'
import Botao from '../ui/Botao'
import Modal from '../ui/Modal'
import VisualizadorFoto from '../Fotos/VisualizadorFoto'
import { useDespesas } from '../../hooks/useDespesas'
import { toast } from '../../services/toast'
import { formatarMoeda, formatarData, hojeISO } from '../../utils/formatters'
import { acharCategoria, nomeUsuario, USUARIOS } from '../../utils/constantes'
import { textoDoSaldo } from '../../utils/saldo'

export default function Saldo() {
  const {
    saldo,
    acertos,
    despesas,
    categorias,
    salvando,
    registrarAcerto,
    removerAcerto,
  } = useDespesas()

  const [confirmarPix, setConfirmarPix] = useState(false)
  const [indiceComp, setIndiceComp] = useState(null)

  // Comprovantes já enviados ao Drive, do mais recente ao mais antigo.
  const comprovantes = useMemo(
    () =>
      despesas
        .filter((d) => d.comprovante_drive_id)
        .map((d) => ({
          id: d.comprovante_drive_id,
          name: `${d.local || 'Despesa'} · ${formatarMoeda(d.valor)}`,
        })),
    [despesas],
  )

  function navegarComp(passo) {
    setIndiceComp((i) => (i + passo + comprovantes.length) % comprovantes.length)
  }

  async function compartilhar() {
    const texto = textoDoSaldo(saldo, formatarMoeda, nomeUsuario)

    // No celular o share nativo abre o WhatsApp direto; no desktop cai na área
    // de transferência.
    if (navigator.share) {
      try {
        await navigator.share({ text: texto })
        return
      } catch (e) {
        if (e.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(texto)
      toast.ok('Resumo copiado — é só colar no WhatsApp.')
    } catch {
      toast.erro('Não consegui copiar para a área de transferência.')
    }
  }

  async function marcarPixFeito() {
    try {
      await registrarAcerto({
        de: saldo.devedor,
        para: saldo.credor,
        valor: saldo.valor,
      })
      toast.ok('Pix registrado — contas zeradas.')
    } catch {
      /* o hook já avisou por toast */
    } finally {
      setConfirmarPix(false)
    }
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <ResumoSaldo saldo={saldo} />

      <Cartao titulo="Quem pagou o quê">
        <ul className="space-y-3.5">
          {USUARIOS.map((u) => {
            const pago = saldo.pago[u.id] ?? 0
            const proporcao = saldo.total > 0 ? (pago / saldo.total) * 100 : 0
            return (
              <li key={u.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-pinheiro-800">
                    {u.nome}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-pinheiro-700">
                    {formatarMoeda(pago)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neve-200">
                  <div
                    className="h-full rounded-full bg-pinheiro-500 transition-[width] duration-500"
                    style={{ width: `${proporcao}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-neve-200 pt-4 text-sm">
          <Linha rotulo="Total gasto" valor={formatarMoeda(saldo.total)} forte />
          <Linha
            rotulo="Cota de cada um (50%)"
            valor={formatarMoeda(saldo.cota)}
          />
          <Linha
            rotulo="Despesas lançadas"
            valor={String(despesas.length)}
          />
          {saldo.totalAcertos > 0 && (
            <Linha
              rotulo="Já acertado por Pix"
              valor={formatarMoeda(saldo.totalAcertos)}
            />
          )}
        </dl>
      </Cartao>

      {Object.keys(saldo.porDia).length > 0 && (
        <Cartao titulo="Gastos por dia">
          <GraficoPorDia porDia={saldo.porDia} />
        </Cartao>
      )}

      {Object.keys(saldo.porCategoria).length > 0 && (
        <Cartao titulo="Gastos por categoria">
          <ul className="space-y-3">
            {Object.entries(saldo.porCategoria)
              .sort(([, a], [, b]) => b - a)
              .map(([id, valor]) => {
                const cat = acharCategoria(id, categorias)
                const proporcao =
                  saldo.total > 0 ? (valor / saldo.total) * 100 : 0
                return (
                  <li key={id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-pinheiro-800">
                        <span aria-hidden="true" className="mr-1.5">
                          {cat.emoji}
                        </span>
                        {cat.label}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-pinheiro-700">
                        {formatarMoeda(valor)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neve-200">
                      <div
                        className="h-full rounded-full bg-outono-500 transition-[width] duration-500"
                        style={{ width: `${proporcao}%` }}
                      />
                    </div>
                  </li>
                )
              })}
          </ul>
        </Cartao>
      )}

      <div className="space-y-2.5">
        <Botao largura variante="accent" onClick={compartilhar}>
          <span aria-hidden="true">📤</span> Compartilhar saldo
        </Botao>

        {!saldo.quites && (
          <Botao
            largura
            variante="secundario"
            onClick={() => setConfirmarPix(true)}
          >
            <span aria-hidden="true">✅</span> Marcar Pix como feito
          </Botao>
        )}

        {comprovantes.length > 0 && (
          <Botao largura variante="secundario" onClick={() => setIndiceComp(0)}>
            <span aria-hidden="true">🧾</span> Ver comprovantes (
            {comprovantes.length})
          </Botao>
        )}
      </div>

      {acertos.length > 0 && (
        <Cartao
          titulo="Histórico de acertos"
          descricao="Pix já feitos entre vocês. Excluir um acerto recalcula o saldo."
        >
          <ul className="space-y-2.5">
            {[...acertos].reverse().map((acerto) => (
              <li
                key={acerto.id}
                className="flex items-center gap-3 rounded-card bg-neve px-3.5 py-3"
              >
                <span aria-hidden="true">💸</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-pinheiro-800">
                    {nomeUsuario(acerto.de)} → {nomeUsuario(acerto.para)}
                  </p>
                  <p className="text-xs text-pinheiro-500">
                    {formatarData(acerto.criado_em?.slice(0, 10))}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-pinheiro-700">
                  {formatarMoeda(acerto.valor)}
                </span>
                <button
                  type="button"
                  onClick={() => removerAcerto(acerto.id)}
                  aria-label={`Excluir acerto de ${formatarMoeda(acerto.valor)}`}
                  className="-mr-1 grid size-11 shrink-0 place-items-center rounded-full text-lg text-pinheiro-300 transition-colors hover:bg-neve-200 hover:text-red-600"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      {indiceComp !== null && comprovantes.length > 0 && (
        <VisualizadorFoto
          fotos={comprovantes}
          indice={indiceComp}
          aoFechar={() => setIndiceComp(null)}
          aoNavegar={navegarComp}
        />
      )}

      <Modal
        aberto={confirmarPix}
        aoFechar={() => setConfirmarPix(false)}
        titulo="Registrar Pix"
        rodape={
          <div className="flex gap-2.5">
            <Botao
              variante="secundario"
              onClick={() => setConfirmarPix(false)}
              className="flex-1"
            >
              Cancelar
            </Botao>
            <Botao
              carregando={salvando}
              onClick={marcarPixFeito}
              className="flex-1"
            >
              Confirmar
            </Botao>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-pinheiro-600">
          Confirmar que{' '}
          <strong className="text-pinheiro-900">
            {nomeUsuario(saldo.devedor)}
          </strong>{' '}
          mandou{' '}
          <strong className="text-pinheiro-900">
            {formatarMoeda(saldo.valor)}
          </strong>{' '}
          para{' '}
          <strong className="text-pinheiro-900">
            {nomeUsuario(saldo.credor)}
          </strong>
          ? O saldo zera e o acerto entra no histórico.
        </p>
      </Modal>
    </div>
  )
}

/** Barras verticais do gasto por dia da viagem (ordem cronológica). */
function GraficoPorDia({ porDia }) {
  const dias = Object.entries(porDia).sort(([a], [b]) => a.localeCompare(b))
  const maximo = Math.max(...dias.map(([, v]) => v), 0)
  const hoje = hojeISO()

  return (
    <ul className="flex items-end gap-2">
      {dias.map(([dia, valor]) => {
        const altura = maximo > 0 ? Math.max(4, (valor / maximo) * 100) : 0
        const ehHoje = dia === hoje
        return (
          <li key={dia} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[11px] font-bold tabular-nums text-pinheiro-700">
              {moedaCurta(valor)}
            </span>
            <div className="flex h-28 w-full items-end">
              <div
                className={`w-full rounded-t transition-[height] duration-500 ${ehHoje ? 'bg-pinheiro-600' : 'bg-outono-500'}`}
                style={{ height: `${altura}%` }}
              />
            </div>
            <span
              className={`text-[11px] tabular-nums ${ehHoje ? 'font-bold text-pinheiro-700' : 'text-pinheiro-500'}`}
            >
              {ddmm(dia)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** "R$ 401" / "R$ 1,2k" — compacto para caber sob as barras. */
function moedaCurta(valor) {
  if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(1).replace('.', ',')}k`
  return `R$ ${Math.round(valor)}`
}

function ddmm(iso) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function Linha({ rotulo, valor, forte = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-pinheiro-500">{rotulo}</dt>
      <dd
        className={`tabular-nums ${forte ? 'font-bold text-pinheiro-800' : 'font-semibold text-pinheiro-600'}`}
      >
        {valor}
      </dd>
    </div>
  )
}
