/*
 * Service worker do CDJ.
 *
 * Só cuida da casca do app (HTML, JS, CSS, ícones) para abrir offline.
 * Dados — Drive e Gemini — nunca passam por cache: saldo errado por resposta
 * velha seria pior que erro de rede, e as respostas carregam token de acesso.
 */
const VERSAO = 'cdj-v1'
const CASCA = `${VERSAO}-casca`
const ESTATICOS = `${VERSAO}-estaticos`

// `./` resolve relativo ao escopo (/CDJ/), então funciona igual em dev e no Pages.
const ESSENCIAIS = ['./', './index.html', './manifest.json', './icons/icon.svg']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CASCA)
      .then((cache) => cache.addAll(ESSENCIAIS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => !nome.startsWith(VERSAO))
            .map((nome) => caches.delete(nome)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Outra origem (Google APIs, fontes, thumbnails): sempre rede.
  if (url.origin !== self.location.origin) return

  // Navegação: rede primeiro para pegar deploy novo; cai no cache se offline.
  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone()
          caches.open(CASCA).then((cache) => cache.put('./index.html', copia))
          return resposta
        })
        .catch(() =>
          caches
            .match('./index.html')
            .then((cache) => cache ?? Response.error()),
        ),
    )
    return
  }

  // Assets do build têm hash no nome, então cache-first é seguro. As fotos da
  // Home saem em /assets/*.jpg (já cobertas por /assets/), mas listamos as
  // extensões de imagem de propósito para deixar explícito.
  if (
    /\/assets\/|\/icons\/|\.(?:css|js|png|jpe?g|webp|svg|woff2?)$/.test(
      url.pathname,
    )
  ) {
    evento.respondWith(
      caches.match(request).then((emCache) => {
        if (emCache) return emCache
        return fetch(request).then((resposta) => {
          if (resposta.ok && resposta.type === 'basic') {
            const copia = resposta.clone()
            caches.open(ESTATICOS).then((cache) => cache.put(request, copia))
          }
          return resposta
        })
      }),
    )
  }
})
