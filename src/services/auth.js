import { assinarConfig, estaConfigurado, setConfig } from '../utils/config'
import { chamar } from './api'

/**
 * "Conexão" no modelo Apps Script.
 *
 * Não há mais OAuth no navegador. Estar "autenticado" agora significa estar
 * CONFIGURADO: ter a URL do Apps Script e o token salvos. Mantemos os nomes
 * antigos (estaAutenticado / assinarAuth / login / logout) para que os hooks e
 * telas continuem funcionando sem reescrever tudo.
 */

export class ErroAuth extends Error {
  constructor(codigo, mensagem) {
    super(mensagem)
    this.name = 'ErroAuth'
    this.codigo = codigo
  }
}

export function estaAutenticado() {
  return estaConfigurado()
}

/** Assina mudanças de conexão (na prática, mudanças de configuração). */
export function assinarAuth(fn) {
  return assinarConfig(fn)
}

/**
 * "Conectar" = validar a conexão com o Apps Script (ping).
 * Lança se a URL/token estiverem ausentes ou se o backend recusar.
 */
export async function login() {
  if (!estaConfigurado()) {
    throw new ErroAuth(
      'NAO_CONFIGURADO',
      'Preencha a URL do Apps Script e o token em Configurações.',
    )
  }
  await chamar('ping')
  return true
}

/** "Desconectar" = esquecer a URL e o token neste aparelho. */
export function logout() {
  setConfig({ APPSCRIPT_URL: '', APP_TOKEN: '' })
}
