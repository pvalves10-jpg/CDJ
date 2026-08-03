import { useState } from 'react'
import ResumoSaldo from './ResumoSaldo'
import Cartao from '../ui/Cartao'
import Botao from '../ui/Botao'
import Modal from '../ui/Modal'
import { useDespesas } from '../../hooks/useDespesas'
import { toast } from '../../services/toast'
import { formatarMoeda, formatarData } from '../../utils/formatters'
import { nomeUsuario, USUARIOS } from '../../utils/constantes'
import { textoDoSaldo } from '../../utils/saldo'

export default function Saldo() {
  const {
    saldo,
    acertos,
    despesas,
    salvando,
    registrarAcerto,
    removerAcerto,
  } = useDespesas()

  const [confirmarPix, setConfirmarPix] = useState(false)

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
                  className="-mr-1 shrink-0 rounded-full px-2 py-1 text-pinheiro-300 hover:bg-neve-200 hover:text-red-600"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </Cartao>
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
