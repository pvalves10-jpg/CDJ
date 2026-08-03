import { formatarMoeda } from '../../utils/formatters'
import { nomeUsuario } from '../../utils/constantes'

/**
 * Cartão com o veredito do saldo. Usado na tela Saldo (grande) e na Home
 * (compacto), para as duas dizerem exatamente a mesma coisa.
 */
export default function ResumoSaldo({ saldo, compacto = false }) {
  if (saldo.quites) {
    return (
      <div
        className={[
          'rounded-card bg-pinheiro-700 text-center text-white shadow-card',
          compacto ? 'px-5 py-5' : 'px-6 py-8',
        ].join(' ')}
      >
        <span aria-hidden="true" className={compacto ? 'text-3xl' : 'text-4xl'}>
          🎉
        </span>
        <p
          className={`mt-2 font-bold ${compacto ? 'text-lg' : 'text-2xl'}`}
        >
          Vocês estão quites
        </p>
        <p className="mt-1 text-sm text-pinheiro-100">
          {saldo.quantidade === 0
            ? 'Nenhuma despesa lançada ainda.'
            : 'Ninguém deve nada a ninguém.'}
        </p>
      </div>
    )
  }

  return (
    <div
      className={[
        'rounded-card bg-pinheiro-700 text-center text-white shadow-card',
        compacto ? 'px-5 py-5' : 'px-6 py-8',
      ].join(' ')}
    >
      <p className="text-sm text-pinheiro-100">
        {nomeUsuario(saldo.devedor)} deve a {nomeUsuario(saldo.credor)}
      </p>
      <p
        className={`mt-1.5 font-extrabold tabular-nums text-outono-300 ${compacto ? 'text-3xl' : 'text-[2.75rem] leading-none'}`}
      >
        {formatarMoeda(saldo.valor)}
      </p>
      {!compacto && (
        <p className="mt-3 text-xs text-pinheiro-200">
          Valor do Pix para zerar a conta
        </p>
      )}
    </div>
  )
}
