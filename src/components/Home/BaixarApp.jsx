import { useState } from 'react'
import Cartao from '../ui/Cartao'
import Modal from '../ui/Modal'
import Botao from '../ui/Botao'
import { useInstalarPWA } from '../../hooks/useInstalarPWA'
import { estaInstalado, instalar } from '../../services/instalar'

export default function BaixarApp() {
  const podeNativo = useInstalarPWA()
  const [modal, setModal] = useState(null) // 'ios' | 'android' | null

  // Já está instalado (rodando standalone): não mostra o convite.
  if (estaInstalado()) return null

  async function baixarAndroid() {
    if (podeNativo) {
      const ok = await instalar()
      if (!ok) setModal('android')
    } else {
      setModal('android')
    }
  }

  return (
    <Cartao
      titulo="📲 Tenha o app no celular"
      descricao="Instale o CDJ na tela inicial e abra como um aplicativo, com o ícone da montagem."
    >
      <div className="grid grid-cols-2 gap-3">
        <BotaoLoja
          onClick={baixarAndroid}
          logo={<LogoAndroid />}
          titulo="Android"
          sub="Instalar app"
        />
        <BotaoLoja
          onClick={() => setModal('ios')}
          logo={<LogoApple />}
          titulo="iPhone"
          sub="Adicionar à tela"
        />
      </div>

      <Modal
        aberto={modal === 'ios'}
        aoFechar={() => setModal(null)}
        titulo="Instalar no iPhone 🍎"
        rodape={
          <Botao largura onClick={() => setModal(null)}>
            Entendi
          </Botao>
        }
      >
        <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-pinheiro-700">
          <li>
            Abra este site no <strong>Safari</strong> (precisa ser o Safari).
          </li>
          <li>
            Toque no botão <strong>Compartilhar</strong> (o quadrado com uma seta
            para cima ↑), na barra de baixo.
          </li>
          <li>
            Role e toque em <strong>“Adicionar à Tela de Início”</strong>.
          </li>
          <li>
            Toque em <strong>Adicionar</strong>. O ícone do app aparece na sua
            tela! ✨
          </li>
        </ol>
      </Modal>

      <Modal
        aberto={modal === 'android'}
        aoFechar={() => setModal(null)}
        titulo="Instalar no Android 🤖"
        rodape={
          <Botao largura onClick={() => setModal(null)}>
            Entendi
          </Botao>
        }
      >
        <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-pinheiro-700">
          <li>
            No <strong>Chrome</strong>, toque no menu <strong>⋮</strong> (três
            pontinhos, canto superior direito).
          </li>
          <li>
            Toque em <strong>“Instalar app”</strong> (ou “Adicionar à tela
            inicial”).
          </li>
          <li>
            Confirme em <strong>Instalar</strong>. O app aparece na sua tela
            inicial. 🎉
          </li>
        </ol>
      </Modal>
    </Cartao>
  )
}

function BotaoLoja({ onClick, logo, titulo, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-card bg-pinheiro-900 px-4 py-3 text-left text-white transition-transform active:scale-[0.98]"
    >
      <span className="shrink-0">{logo}</span>
      <span className="min-w-0">
        <span className="block text-[11px] leading-none text-white/70">
          {sub}
        </span>
        <span className="block text-base leading-tight font-bold">{titulo}</span>
      </span>
    </button>
  )
}

function LogoAndroid() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="#3DDC84" aria-hidden="true">
      <path d="M17.6 9.48l1.84-3.18a.4.4 0 0 0-.7-.4l-1.87 3.23a11.4 11.4 0 0 0-9.74 0L5.26 5.9a.4.4 0 1 0-.7.4L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  )
}

function LogoApple() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="#ffffff" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.04.28.04.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.635 0 2.928.06 4.42 2.19-.11.07-2.573 1.51-2.573 4.4 0 3.35 2.94 4.53 3.028 4.55z" />
    </svg>
  )
}
