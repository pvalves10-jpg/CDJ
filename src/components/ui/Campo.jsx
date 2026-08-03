import { useId, useState } from 'react'

const BASE_INPUT = [
  'w-full rounded-card border bg-white px-3.5 py-3 text-[15px] text-pinheiro-900',
  'placeholder:text-pinheiro-300',
  'outline-none transition-colors',
  'focus:border-pinheiro-500 focus:ring-2 focus:ring-pinheiro-100',
].join(' ')

export default function Campo({
  rotulo,
  ajuda,
  erro,
  secreto = false,
  className = '',
  ...props
}) {
  const id = useId()
  const [revelado, setRevelado] = useState(false)
  const borda = erro ? 'border-red-400' : 'border-neve-300'

  return (
    <div className={className}>
      {rotulo && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-semibold text-pinheiro-700"
        >
          {rotulo}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={secreto && !revelado ? 'password' : 'text'}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          className={`${BASE_INPUT} ${borda} ${secreto ? 'pr-14' : ''}`}
          {...props}
        />
        {secreto && (
          <button
            type="button"
            onClick={() => setRevelado((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-pinheiro-500 hover:text-pinheiro-700"
          >
            {revelado ? 'ocultar' : 'ver'}
          </button>
        )}
      </div>

      {erro ? (
        <p className="mt-1.5 text-xs text-red-600">{erro}</p>
      ) : ajuda ? (
        <p className="mt-1.5 text-xs leading-relaxed text-pinheiro-500">
          {ajuda}
        </p>
      ) : null}
    </div>
  )
}

export function Seletor({ rotulo, ajuda, className = '', children, ...props }) {
  const id = useId()
  return (
    <div className={className}>
      {rotulo && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-semibold text-pinheiro-700"
        >
          {rotulo}
        </label>
      )}
      <select
        id={id}
        className={`${BASE_INPUT} border-neve-300 appearance-none bg-[length:1.1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a7c3c' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
      {ajuda && (
        <p className="mt-1.5 text-xs leading-relaxed text-pinheiro-500">
          {ajuda}
        </p>
      )}
    </div>
  )
}
