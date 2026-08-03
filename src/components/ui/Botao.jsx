const VARIANTES = {
  primario:
    'bg-pinheiro-700 text-white shadow-card hover:bg-pinheiro-800 active:bg-pinheiro-900 disabled:bg-pinheiro-300',
  accent:
    'bg-outono-500 text-white shadow-card hover:bg-outono-600 active:bg-outono-700 disabled:bg-outono-200',
  secundario:
    'border border-pinheiro-200 bg-white text-pinheiro-700 hover:bg-pinheiro-50 active:bg-pinheiro-100 disabled:text-pinheiro-300',
  fantasma:
    'text-pinheiro-600 hover:bg-pinheiro-50 active:bg-pinheiro-100 disabled:text-pinheiro-300',
  perigo:
    'bg-red-600 text-white shadow-card hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
}

const TAMANHOS = {
  md: 'h-12 px-5 text-[15px]',
  sm: 'h-9 px-3.5 text-sm',
}

export default function Botao({
  variante = 'primario',
  tamanho = 'md',
  carregando = false,
  largura = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-card font-semibold',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-outono-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        VARIANTES[variante],
        TAMANHOS[tamanho],
        largura ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {carregando && <Spinner />}
      {children}
    </button>
  )
}

export function Spinner({ className = 'size-4' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-3.5A6.5 6.5 0 0 0 12 5.5V2Z"
      />
    </svg>
  )
}
