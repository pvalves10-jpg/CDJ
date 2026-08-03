/**
 * CDJ — Backend em Google Apps Script (Web App)
 * ------------------------------------------------------------------
 * Faz a ponte entre o app estático (GitHub Pages) e o Google Drive + Gemini.
 * Roda NA SUA CONTA (Paulo Victor), então tem acesso total às suas pastas
 * sem OAuth no navegador. Protegido por um token compartilhado.
 *
 * ┌─ SETUP (uma vez) ───────────────────────────────────────────────┐
 * │ 1. Acesse https://script.google.com → "Novo projeto".           │
 * │ 2. Apague o conteúdo padrão e cole ESTE arquivo inteiro.        │
 * │ 3. Engrenagem "Configurações do projeto" → role até            │
 * │    "Propriedades do script" → "Adicionar propriedade" e crie:   │
 * │       TOKEN          =  invente uma senha longa (a MESMA vai     │
 * │                         no app, em Configurações → Token)        │
 * │       PASTA_DESPESAS =  1bw_Mcfj3N7AJmkFK-nelvbk5W8D7_3jA        │
 * │       PASTA_FOTOS    =  1hOsOQqX9QWUUuYC298gBjktcGw9NBZ86        │
 * │       GEMINI_API_KEY =  sua chave do Google AI Studio            │
 * │ 4. "Implantar" → "Nova implantação" → engrenagem → "App da Web":│
 * │       Executar como:      Eu (seu e-mail)                        │
 * │       Quem pode acessar:  Qualquer pessoa                        │
 * │    Clique "Implantar", autorize o acesso ao Drive e COPIE a URL  │
 * │    que termina em /exec.                                         │
 * │ 5. Cole essa URL no app: Configurações → "URL do Apps Script".   │
 * │                                                                  │
 * │ Ao EDITAR este script depois: "Implantar" → "Gerenciar          │
 * │ implantações" → lápis → Versão: "Nova versão" → "Implantar".     │
 * └──────────────────────────────────────────────────────────────────┘
 */

var ARQUIVO_DESPESAS = 'despesas.json';

/** Prompt exato do CLAUDE.md — não alterar. */
var PROMPT_GEMINI =
  'Analise este comprovante de pagamento brasileiro e retorne APENAS um JSON válido, sem markdown, sem texto adicional:\n' +
  '{\n' +
  '  "local": "nome do estabelecimento ou loja",\n' +
  '  "data": "YYYY-MM-DD",\n' +
  '  "valor": 0.00,\n' +
  '  "categoria": "restaurante|hospedagem|transporte|mercado|passeio|outro"\n' +
  '}\n' +
  'Se não conseguir identificar algum campo, use null.';

/** Modelos tentados na ordem (do mais novo ao mais antigo). */
var MODELOS_GEMINI = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

/* ------------------------------------------------------------- entrada */

function doGet(e) {
  return tratar_(e);
}

function doPost(e) {
  return tratar_(e);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function props_() {
  return PropertiesService.getScriptProperties();
}

function tratar_(e) {
  try {
    var req = {};
    if (e && e.postData && e.postData.contents) {
      req = JSON.parse(e.postData.contents);
    } else if (e && e.parameter && e.parameter.action) {
      req = e.parameter;
    }

    var tokenEsperado = props_().getProperty('TOKEN');
    if (!tokenEsperado) {
      return json_({ ok: false, erro: 'TOKEN não configurado no Apps Script.' });
    }
    if (req.token !== tokenEsperado) {
      return json_({ ok: false, erro: 'Token inválido.' });
    }

    switch (req.action) {
      case 'ping':
        return json_(ping_());
      case 'ler':
        return json_({ ok: true, dados: lerDespesas_() });
      case 'salvar':
        return json_({ ok: true, dados: salvarDespesas_(req.dados) });
      case 'listarFotos':
        return json_({ ok: true, fotos: listarFotos_() });
      case 'upload':
        return json_({ ok: true, arquivo: upload_(req) });
      case 'imagem':
        return json_(imagem_(req));
      case 'thumb':
        return json_(thumb_(req));
      case 'excluir':
        excluir_(req.id);
        return json_({ ok: true });
      case 'gemini':
        return json_({ ok: true, texto: gemini_(req) });
      case 'chat':
        return json_({ ok: true, texto: chat_(req) });
      default:
        return json_({ ok: false, erro: 'Ação desconhecida: ' + req.action });
    }
  } catch (err) {
    return json_({ ok: false, erro: String((err && err.message) || err) });
  }
}

/* --------------------------------------------------------------- pastas */

function pastaDespesas_() {
  var id = props_().getProperty('PASTA_DESPESAS');
  if (!id) throw new Error('PASTA_DESPESAS não configurada no Apps Script.');
  return DriveApp.getFolderById(id);
}

function pastaFotos_() {
  var id = props_().getProperty('PASTA_FOTOS');
  if (!id) throw new Error('PASTA_FOTOS não configurada no Apps Script.');
  return DriveApp.getFolderById(id);
}

function acharArquivo_(pasta, nome) {
  var it = pasta.getFilesByName(nome);
  return it.hasNext() ? it.next() : null;
}

/* ------------------------------------------------------------- despesas */

function envelopeVazio_() {
  return {
    versao: 1,
    despesas: [],
    categorias_custom: [],
    acertos: [],
    guia: { fotos_spots: {}, experiencias: {}, roteiro: {} },
  };
}

function lerDespesas_() {
  var f = acharArquivo_(pastaDespesas_(), ARQUIVO_DESPESAS);
  if (!f) return envelopeVazio_();
  var txt = f.getBlob().getDataAsString('UTF-8');
  if (!txt || !txt.trim()) return envelopeVazio_();
  return JSON.parse(txt);
}

/**
 * Sobrescreve o despesas.json. DriveApp não tem "setContent", então removemos
 * as versões antigas (vão para a lixeira, sem apagar de vez) e criamos uma nova.
 */
function salvarDespesas_(dados) {
  var pasta = pastaDespesas_();
  var corpo = JSON.stringify(dados);
  var it = pasta.getFilesByName(ARQUIVO_DESPESAS);
  while (it.hasNext()) {
    it.next().setTrashed(true);
  }
  pasta.createFile(ARQUIVO_DESPESAS, corpo, 'application/json');
  return dados;
}

/* ---------------------------------------------------------------- fotos */

function descreverArquivo_(f) {
  return {
    id: f.getId(),
    name: f.getName(),
    mimeType: f.getMimeType(),
    createdTime: f.getDateCreated().toISOString(),
    size: f.getSize(),
  };
}

function listarFotos_() {
  var it = pastaFotos_().getFiles();
  var arr = [];
  while (it.hasNext()) {
    var f = it.next();
    var mt = f.getMimeType();
    if (mt && mt.indexOf('image/') === 0) arr.push(descreverArquivo_(f));
  }
  // Mais recentes primeiro.
  arr.sort(function (a, b) {
    return a.createdTime < b.createdTime ? 1 : a.createdTime > b.createdTime ? -1 : 0;
  });
  return arr;
}

function upload_(req) {
  var pasta = req.alvo === 'fotos' ? pastaFotos_() : pastaDespesas_();
  var bytes = Utilities.base64Decode(req.base64);
  var blob = Utilities.newBlob(
    bytes,
    req.mimeType || 'application/octet-stream',
    req.nome || 'arquivo',
  );
  var f = pasta.createFile(blob);
  return descreverArquivo_(f);
}

function imagem_(req) {
  var f = DriveApp.getFileById(req.id);
  var blob = f.getBlob();
  return {
    ok: true,
    base64: Utilities.base64Encode(blob.getBytes()),
    mimeType: blob.getContentType(),
  };
}

/**
 * Miniatura leve: usa o thumbnail nativo do Drive (muito menor que a foto
 * inteira). Se falhar por qualquer motivo, cai para a imagem inteira — a
 * galeria nunca quebra.
 */
function thumb_(req) {
  var id = req.id;
  if (!id) throw new Error('id ausente');
  var size = parseInt(req.tamanho, 10) || 400;
  if (size < 64) size = 64;
  if (size > 1600) size = 1600;
  try {
    var url =
      'https://drive.google.com/thumbnail?id=' +
      encodeURIComponent(id) +
      '&sz=w' +
      size;
    var resp = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
      followRedirects: true,
    });
    if (resp.getResponseCode() === 200) {
      var blob = resp.getBlob();
      var ct = blob.getContentType() || '';
      if (ct.indexOf('image/') === 0) {
        return {
          ok: true,
          base64: Utilities.base64Encode(blob.getBytes()),
          mimeType: ct,
        };
      }
    }
  } catch (e) {
    /* cai no fallback abaixo */
  }
  return imagem_(req);
}

function excluir_(id) {
  if (id) DriveApp.getFileById(id).setTrashed(true);
}

/* --------------------------------------------------------------- gemini */

function gemini_(req) {
  var chave = props_().getProperty('GEMINI_API_KEY');
  if (!chave) throw new Error('GEMINI_API_KEY não configurada no Apps Script.');

  var payload = {
    contents: [
      {
        parts: [
          { text: PROMPT_GEMINI },
          { inline_data: { mime_type: req.mimeType, data: req.base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
  };

  var ultimo = '';
  for (var i = 0; i < MODELOS_GEMINI.length; i++) {
    var url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      MODELOS_GEMINI[i] +
      ':generateContent?key=' +
      encodeURIComponent(chave);

    var resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    var code = resp.getResponseCode();
    if (code === 200) {
      var data = JSON.parse(resp.getContentText());
      var cand = data.candidates && data.candidates[0];
      var texto = '';
      if (cand && cand.content && cand.content.parts) {
        texto = cand.content.parts
          .map(function (p) {
            return p.text || '';
          })
          .join('');
      }
      return texto;
    }

    ultimo = resp.getContentText();
    // 404 = modelo inexistente para esta chave; tenta o próximo da lista.
    if (code !== 404) throw new Error('Gemini erro ' + code + ': ' + ultimo);
  }
  throw new Error('Nenhum modelo do Gemini respondeu. ' + ultimo);
}

/* ------------------------------------------------------------------ chat */

var PERSONA_CHAT =
  'Você é um roteirista de viagem simpático e especialista em Campos do Jordão ' +
  '(SP, Brasil). Está ajudando um casal, Louise e Paulo Victor, na primeira ' +
  'viagem deles a Campos do Jordão (04 a 07/08). Responda SEMPRE em português ' +
  'do Brasil, de forma curta, prática e calorosa. Dê dicas de passeios, ' +
  'restaurantes, clima, o que levar, rotas, o que fazer se chover, custos ' +
  'aproximados e ideias românticas. Use no máximo uns 4 parágrafos curtos ou ' +
  'uma lista objetiva. Quando precisar de informações ATUAIS (preços, horários, ' +
  'eventos, disponibilidade, clima), PESQUISE na web com a ferramenta de busca ' +
  'e cite o que encontrou. Se receber uma FOTO, analise-a (ex.: identificar um ' +
  'lugar, ler um cardápio ou uma placa). Se receber um ÁUDIO, entenda o que foi ' +
  'dito e responda normalmente. FORMATAÇÃO: escreva bem organizado em MARKDOWN — ' +
  'use **negrito** para títulos e nomes de lugares, listas com "- " quando fizer ' +
  'sentido e parágrafos curtos separados por uma linha em branco. Use emojis com ' +
  'bom gosto (1 a 3 por bloco, ex.: 🏔️ 🍽️ ☕ 🌧️ 💡 📍 💰) para deixar leve e ' +
  'visual, sem exagerar. Comece com uma frase calorosa e termine com uma dica ou ' +
  'uma pergunta. Tom profissional, mas acolhedor.';

// Modelos que suportam busca na web (google_search) e entrada de foto/áudio.
var MODELOS_CHAT = ['gemini-2.5-flash', 'gemini-2.0-flash'];

function chat_(req) {
  var chave = props_().getProperty('GEMINI_API_KEY');
  if (!chave) throw new Error('GEMINI_API_KEY não configurada no Apps Script.');

  var mensagens = req.mensagens || [];
  var contents = [];
  for (var i = 0; i < mensagens.length; i++) {
    var m = mensagens[i];
    var parts = [];
    var texto = String((m && m.texto) || '').trim();
    if (texto) parts.push({ text: texto });
    var anexos = (m && m.anexos) || [];
    for (var k = 0; k < anexos.length; k++) {
      var a = anexos[k];
      if (a && a.base64 && a.mimeType) {
        parts.push({ inline_data: { mime_type: a.mimeType, data: a.base64 } });
      }
    }
    if (!parts.length) continue;
    contents.push({ role: m.autor === 'ia' ? 'model' : 'user', parts: parts });
  }
  if (!contents.length) throw new Error('Mensagem vazia.');

  var base = {
    systemInstruction: { parts: [{ text: PERSONA_CHAT }] },
    contents: contents,
    generationConfig: { temperature: 0.7 },
  };
  var comTools = {
    systemInstruction: base.systemInstruction,
    contents: contents,
    tools: [{ google_search: {} }],
    generationConfig: base.generationConfig,
  };

  function extrair_(resp) {
    var data = JSON.parse(resp.getContentText());
    var cand = data.candidates && data.candidates[0];
    if (cand && cand.content && cand.content.parts) {
      return cand.content.parts
        .map(function (p) {
          return p.text || '';
        })
        .join('');
    }
    return '';
  }
  function bater_(url, payload) {
    return UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
  }

  var ultimo = '';
  for (var j = 0; j < MODELOS_CHAT.length; j++) {
    var url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      MODELOS_CHAT[j] +
      ':generateContent?key=' +
      encodeURIComponent(chave);

    var resp = bater_(url, comTools);
    var code = resp.getResponseCode();
    if (code === 200) return extrair_(resp);

    // A busca na web (tool) pode não estar disponível nesta chave: tenta sem.
    if (code === 400) {
      var resp2 = bater_(url, base);
      if (resp2.getResponseCode() === 200) return extrair_(resp2);
      ultimo = resp2.getContentText();
    } else {
      ultimo = resp.getContentText();
      if (code !== 404) throw new Error('Gemini erro ' + code + ': ' + ultimo);
    }
  }
  throw new Error('Nenhum modelo do Gemini respondeu. ' + ultimo);
}

/* ----------------------------------------------------------------- ping */

function ping_() {
  var out = { ok: true };
  try {
    out.despesas = lerDespesas_().despesas.length;
  } catch (e) {
    out.ok = false;
    out.despesasErro = String((e && e.message) || e);
  }
  try {
    out.fotos = listarFotos_().length;
  } catch (e) {
    out.ok = false;
    out.fotosErro = String((e && e.message) || e);
  }
  out.gemini = Boolean(props_().getProperty('GEMINI_API_KEY'));
  return out;
}
