# CLAUDE.md — Projeto CDJ

> Arquivo de memória do projeto. Leia isto antes de qualquer ação.

## O que é este projeto

**CDJ** (Campos do Jordão) é um **Progressive Web App (PWA)** para gerenciar a viagem de **Paulo Victor** e **Louise** a Campos do Jordão. Resolve dois problemas práticos: organizar fotos da viagem e controlar despesas com divisão automática 50/50.

O app é **100% estático** — sem servidor próprio. O Google Drive é o backend.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite |
| Estilo | Tailwind CSS |
| Hospedagem | GitHub Pages |
| Deploy | GitHub Actions (automático no push para `main`) |
| Armazenamento | Google Drive API v3 |
| Leitura de comprovantes | Google Gemini API (multimodal) |
| Autenticação | Google Identity Services (OAuth2 client-side) |

---

## Configuração — variáveis necessárias

O arquivo `src/config.js` (não commitado) ou via prompt no primeiro uso do app:

```js
// src/config.js — NÃO commitar se contiver chaves reais
export const CONFIG = {
  GEMINI_API_KEY: "",       // fornecida pelo usuário ao Claude Code
  GOOGLE_CLIENT_ID: "",     // OAuth2 — criado no Google Cloud Console
  DRIVE_FOLDER_ID: "",      // ID da pasta CDJ no Google Drive (fornecida pelo usuário)
};
```

> **Nota de segurança:** por ser projeto pessoal/fechado entre duas pessoas, as chaves ficam no cliente. Não publicar o `config.js` com chaves — usar `.gitignore`.

---

## Estrutura do Google Drive

A pasta já existe no Drive do usuário com a seguinte hierarquia:

```
CDJ/                          ← pasta raiz (ID fornecido pelo usuário)
├── DESPESAS/                 ← comprovantes + despesas.json
│   ├── despesas.json         ← banco de dados das despesas (criado pelo app)
│   └── YYYY-MM-DD_local.jpg  ← comprovantes uploadados
└── FOTOS/                    ← fotos da viagem
```

O app **nunca cria a estrutura** — ela já existe. Apenas lê e escreve dentro dela.

---

## Regras de negócio

### Usuários
Fixos, sem login próprio do app. Ao abrir o app pela primeira vez, pergunta "Você é Paulo Victor ou Louise?" e salva no `localStorage`.

### Divisão de despesas
- Toda despesa é **50/50**
- Quem pagou = quem adiantou o valor total
- A outra pessoa deve metade
- O **saldo final** é a soma líquida: quem deve a quem e quanto (valor do Pix de acerto)

### Modelo de dados — Despesa

```json
{
  "id": "uuid-v4",
  "data": "2026-07-15",
  "local": "Restaurante Boa Mesa",
  "valor": 120.00,
  "categoria": "restaurante",
  "pagador": "paulo_victor",
  "comprovante_drive_id": "1abc...",
  "criado_em": "2026-07-15T19:30:00Z"
}
```

O arquivo `despesas.json` é um array dessas despesas, lido e escrito diretamente no Drive.

### Categorias

```js
const CATEGORIAS = [
  { id: "restaurante",  emoji: "🍽️", label: "Restaurante" },
  { id: "hospedagem",   emoji: "🏨", label: "Hospedagem" },
  { id: "transporte",   emoji: "🚗", label: "Transporte" },
  { id: "mercado",      emoji: "🛒", label: "Mercado" },
  { id: "passeio",      emoji: "🎭", label: "Passeio" },
  { id: "outro",        emoji: "📌", label: "Outro" },
];
```

Categorias são editáveis — o usuário pode adicionar novas. Salvar lista customizada no `despesas.json` como campo `categorias_custom`.

---

## Telas e funcionalidades

### Tela inicial (Home)
- Fotos de Paulo Victor e Louise (assets fixos no app — imagens escolhidas pelo usuário)
- Card de saldo rápido: "Louise deve R$ X a Paulo Victor" ou "Vocês estão quites"
- Acesso ao menu lateral (ícone hambúrguer ou swipe)

### Menu lateral (Drawer)
```
📸  Fotos
🧾  Despesas
💰  Saldo
⚙️  Configurações
```

### Seção: Fotos
- Botão "Enviar fotos" → input múltiplo → upload para `CDJ/FOTOS/` no Drive
- Galeria em grid com thumbnails (carregadas via Drive API)
- Tap na foto → visualização em fullscreen

### Seção: Despesas
- Lista cronológica (mais recente no topo)
- Cada item: emoji da categoria + local + data + valor + quem pagou
- FAB (botão flutuante) "+" com duas opções:
  - 📷 **Fotografar comprovante** → Gemini extrai os dados → formulário pré-preenchido
  - ✏️ **Inserir manualmente** → formulário em branco
- Swipe para esquerda no item → opções editar / excluir

### Seção: Saldo
- Total pago por Paulo Victor: R$ X
- Total pago por Louise: R$ X
- Diferença: quem deve a quem e quanto
- Botão "Compartilhar saldo" (texto formatado para colar no WhatsApp)
- Histórico de acerto (marcar como "Pix feito")

### Configurações
- Campos para inserir `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `DRIVE_FOLDER_ID`
- Botão "Testar conexão" para validar as chaves
- Seletor de usuário atual (Paulo Victor / Louise)

---

## Fluxo de leitura de comprovante (Gemini)

```
1. Usuário abre câmera ou seleciona imagem
2. App converte imagem para base64
3. Envia para Gemini API (gemini-1.5-flash) com prompt estruturado
4. Gemini retorna JSON com: local, data, valor, categoria
5. App exibe formulário pré-preenchido para revisão
6. Usuário confirma (ou edita) → app salva despesa no Drive
7. Upload do comprovante para CDJ/DESPESAS/ no Drive
```

### Prompt Gemini (usar exatamente este):

```
Analise este comprovante de pagamento brasileiro e retorne APENAS um JSON válido, sem markdown, sem texto adicional:
{
  "local": "nome do estabelecimento ou loja",
  "data": "YYYY-MM-DD",
  "valor": 0.00,
  "categoria": "restaurante|hospedagem|transporte|mercado|passeio|outro"
}
Se não conseguir identificar algum campo, use null.
```

---

## Design / UX

- **Mobile-first** — otimizado para 375px de largura
- **Paleta**: tons de verde-pinheiro (`#2D5016`), branco neve (`#F8F9FA`), laranja outonal (`#E8731A`) como accent
- **Tipografia**: Inter (Google Fonts)
- **Componentes**: cards com sombra suave, bordas arredondadas (12px), espaçamento generoso
- **Emojis**: usar nas categorias e botões para identificação visual rápida
- **PWA**: `manifest.json` + service worker básico (cache offline da interface)
- **Feedback**: loading states em todas as operações de rede, toasts de sucesso/erro

---

## Estrutura de pastas do repositório

```
CDJ/
├── public/
│   ├── manifest.json
│   ├── sw.js               ← service worker
│   └── icons/              ← ícones do PWA
├── src/
│   ├── components/
│   │   ├── Layout/         ← Drawer, Header
│   │   ├── Home/
│   │   ├── Despesas/
│   │   ├── Fotos/
│   │   ├── Saldo/
│   │   └── Configuracoes/
│   ├── services/
│   │   ├── drive.js        ← Google Drive API (ler/escrever JSON, upload)
│   │   ├── gemini.js       ← Gemini API (extrair dados de comprovante)
│   │   └── auth.js         ← Google OAuth2
│   ├── hooks/
│   │   ├── useDespesas.js
│   │   └── useDrive.js
│   ├── utils/
│   │   ├── saldo.js        ← cálculo 50/50
│   │   └── formatters.js   ← moeda, data
│   ├── config.js           ← ⚠️ no .gitignore
│   ├── App.jsx
│   └── main.jsx
├── .github/
│   └── workflows/
│       └── deploy.yml      ← GitHub Actions → GitHub Pages
├── .gitignore
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── CLAUDE.md               ← este arquivo
```

---

## GitHub Actions — deploy automático

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Ordem de implementação

1. Setup (Vite + React + Tailwind + estrutura de pastas)
2. `config.js` + tela de Configurações (inserir chaves, testar conexão)
3. `auth.js` — Google OAuth2 (login com Google para autorizar Drive)
4. `drive.js` — ler/escrever `despesas.json`, upload de arquivos
5. Seção Despesas — lista + adicionar manualmente + cálculo de saldo
6. `gemini.js` — leitura de comprovante via foto
7. Seção Fotos — upload + galeria
8. Seção Saldo — painel consolidado
9. Tela Home — foto dos usuários + card de saldo rápido
10. PWA — `manifest.json` + service worker + ícones
11. GitHub Actions — deploy automático no GitHub Pages
12. Testes de ponta a ponta no mobile (Chrome DevTools → modo mobile)

---

## O que o usuário vai fornecer ao Claude Code

- `GEMINI_API_KEY` — chave da Google AI Studio
- Link/ID da pasta CDJ no Google Drive
- `GOOGLE_CLIENT_ID` — após criar projeto no Google Cloud Console (Claude Code guia o processo)
- Fotos de Paulo Victor e Louise para a tela inicial (assets)
