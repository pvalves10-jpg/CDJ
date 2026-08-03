export default function Cartao({ titulo, descricao, className = '', children }) {
  return (
    <section
      className={`rounded-card bg-white p-5 shadow-card ${className}`}
    >
      {titulo && (
        <h2 className="text-base font-bold text-pinheiro-800">{titulo}</h2>
      )}
      {descricao && (
        <p className="mt-1 text-sm leading-relaxed text-pinheiro-500">
          {descricao}
        </p>
      )}
      {(titulo || descricao) && children ? <div className="mt-4">{children}</div> : children}
    </section>
  )
}
