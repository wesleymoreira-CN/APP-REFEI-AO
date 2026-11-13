/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole, ClientRampaOrder, SystemSpreadsheet } from '../types';
import { isValidCancaoNovaEmail } from '../utils/validators';

export const EXTERNAL_SHEET_URL_STORAGE_KEY = 'cardapiopro_external_users_sheet_url_v1';
export const EXTERNAL_USERS_CACHE_KEY = 'cardapiopro_external_users_cache_v1';
export const LAST_SYNC_STORAGE_KEY = 'cardapiopro_external_users_last_sync_v1';

// Google Apps Script Web App integration keys
export const APPS_SCRIPT_URL_STORAGE_KEY = 'cardapiopro_apps_script_url_v1';
export const AUTO_SYNC_APPS_SCRIPT_KEY = 'cardapiopro_auto_sync_apps_script_v1';
export const LAST_APPS_SCRIPT_SYNC_KEY = 'cardapiopro_last_apps_script_sync_v1';

// Initial default users registered with passwords in the database
export const INITIAL_EXTERNAL_USERS: (User & { password?: string; active?: boolean })[] = [
  {
    id: 'usr-wesley',
    name: 'Wesley Moreira',
    email: 'wesley.moreira@comunidadecancaonova.com',
    password: '123',
    role: 'master',
    department: 'Coordenação de Nutrição & Peregrinos',
    active: true,
    source: 'sheets',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-maria',
    name: 'Maria Silva',
    email: 'maria.silva@cancaonova.com',
    password: '123',
    role: 'admin',
    department: 'Nutrição Clínica & Cardápios',
    active: true,
    source: 'sheets',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'usr-eventos',
    name: 'Coordenação de Eventos & Retiros',
    email: 'eventos.retiros@cancaonova.com',
    password: '123',
    role: 'cliente',
    department: 'Eventos & Peregrinações Canção Nova',
    active: true,
    source: 'sheets',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'usr-cantina',
    name: 'Cantina & Cozinha Central',
    email: 'cantina.refeitorio@cancaonova.com',
    password: '123',
    role: 'admin',
    department: 'Cozinha Central & Salão de Refeições',
    active: true,
    source: 'sheets',
    createdAt: '2026-02-10T11:00:00Z',
  },
  {
    id: 'usr-cliente-peregrino',
    name: 'Setor de Acolhimento aos Peregrinos',
    email: 'cliente.peregrinos@cancaonova.com',
    password: '123',
    role: 'cliente',
    department: 'Acolhimento & Caravanas',
    active: true,
    source: 'sheets',
    createdAt: '2026-02-15T12:00:00Z',
  },
];

/**
 * Checks whether a URL points to a deployed Google Apps Script Web App (/exec or /dev)
 */
export function isAppsScriptUrl(url: string): boolean {
  const clean = (url || '').trim().toLowerCase();
  return clean.includes('script.google.com') || clean.includes('script.googleusercontent.com');
}

export function validateAppsScriptEndpoint(rawUrl: string): { valid: boolean; cleanUrl: string; error?: string } {
  const clean = (rawUrl || '').trim();
  if (!clean) {
    return {
      valid: false,
      cleanUrl: '',
      error: 'Informe a URL do App da Web do Google Apps Script terminada em /exec.',
    };
  }

  const lower = clean.toLowerCase();

  if (lower.includes('docs.google.com/spreadsheets')) {
    return {
      valid: false,
      cleanUrl: clean,
      error: 'Você colou o link da planilha Google Sheets, e não a URL do Apps Script. Na planilha, vá em Extensões > Apps Script > Implantar > App da Web e copie a URL terminada em /exec.',
    };
  }

  if (!isAppsScriptUrl(clean)) {
    return {
      valid: false,
      cleanUrl: clean,
      error: 'URL inválida. A URL do Google Apps Script Web App deve começar com https://script.google.com/macros/s/.../exec',
    };
  }

  if (lower.includes('/home/projects') || lower.includes('/edit')) {
    return {
      valid: false,
      cleanUrl: clean,
      error: 'Você colou o link do editor do Apps Script. Clique em "Implantar > Nova implantação > App da Web" e copie a URL gerada terminada em /exec.',
    };
  }

  if (lower.endsWith('/dev') || lower.includes('/dev?')) {
    return {
      valid: false,
      cleanUrl: clean,
      error: 'A URL terminada em /dev é apenas de teste e exige login Google. Use a URL de produção da implantação terminada em /exec.',
    };
  }

  let normalized = clean;
  try {
    const parsed = new URL(clean);
    if (parsed.hostname === 'script.google.com') {
      parsed.pathname = parsed.pathname
        .replace(/^\/a\/macros\/[^/]+\/s\//i, '/macros/s/')
        .replace(/^\/macros\/u\/\d+\/s\//i, '/macros/s/');
      normalized = parsed.toString();
    }
  } catch {
    normalized = clean;
  }

  return { valid: true, cleanUrl: normalized };
}

function formatFriendlyFetchError(err: unknown, contextLabel: string): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  if (!raw || raw.toLowerCase().includes('failed to fetch') || raw.toLowerCase().includes('networkerror') || raw.toLowerCase().includes('load failed')) {
    return `Não foi possível conectar ao ${contextLabel}. Verifique: (1) se a URL termina em /exec; (2) se em "Implantar > Gerenciar implantações" a opção "Quem pode acessar" está definida como "Qualquer pessoa" (Anyone); (3) se a planilha ou script permite acesso externo.`;
  }
  return raw;
}

export const SHEETS_PROXY_URL_STORAGE_KEY = 'cardapiopro_sheets_proxy_url_v1';

function getSafeEnvVar(key: 'VITE_APPS_SCRIPT_URL' | 'VITE_EXTERNAL_SHEET_URL' | 'VITE_SHEETS_PROXY_URL'): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    return (env?.[key] || '').trim();
  } catch {
    return '';
  }
}

export function getInitialAppsScriptUrl(): string {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = (params.get('scriptUrl') || '').trim();
      if (fromQuery && isAppsScriptUrl(fromQuery)) {
        localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, fromQuery);
        return fromQuery;
      }
    }
    const stored = (localStorage.getItem(APPS_SCRIPT_URL_STORAGE_KEY) || '').trim();
    if (stored) return stored;
  } catch {
    // ignore storage errors
  }
  return getSafeEnvVar('VITE_APPS_SCRIPT_URL');
}

export function getInitialExternalSheetUrl(): string {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = (params.get('sheetUrl') || '').trim();
      if (fromQuery) {
        localStorage.setItem(EXTERNAL_SHEET_URL_STORAGE_KEY, fromQuery);
        return fromQuery;
      }
    }
    const stored = (localStorage.getItem(EXTERNAL_SHEET_URL_STORAGE_KEY) || '').trim();
    if (stored) return stored;
  } catch {
    // ignore storage errors
  }
  return getSafeEnvVar('VITE_EXTERNAL_SHEET_URL');
}

function normalizeAppsScriptEndpointUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.hostname === 'script.google.com') {
      parsed.pathname = parsed.pathname
        .replace(/^\/a\/macros\/[^/]+\/s\//i, '/macros/s/')
        .replace(/^\/macros\/u\/\d+\/s\//i, '/macros/s/');
    }
    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

function detectDirectGoogleHtmlError(bodyText: string, finalUrl: string, status: number): string | null {
  const lowerUrl = (finalUrl || '').toLowerCase();
  const lowerBody = (bodyText || '').toLowerCase();
  const trimmed = (bodyText || '').trim().toLowerCase();

  if (lowerUrl.includes('accounts.google.com') || lowerUrl.includes('servicelogin')) {
    return 'O Google redirecionou para login (accounts.google.com). No Apps Script, defina "Executar como: Eu" e "Quem pode acessar: Qualquer pessoa".';
  }

  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    if (lowerBody.includes('accounts.google.com') || lowerBody.includes('servicelogin') || lowerBody.includes('fazer login') || lowerBody.includes('sign in')) {
      return 'O Apps Script ou Planilha exige login Google. Configure "Executar como: Eu" e "Quem pode acessar: Qualquer pessoa".';
    }
    if (lowerBody.includes('script function not found')) {
      return 'Função doGet/doPost não encontrada no Apps Script. Salve o código completo e crie uma Nova Versão em Gerenciar implantações.';
    }
    if (lowerBody.includes('desculpe') || lowerBody.includes('sorry, unable to open') || lowerBody.includes('não foi possível abrir')) {
      return `O Google retornou "Não foi possível abrir o arquivo" (HTTP ${status}). Verifique se "Quem pode acessar" está como "Qualquer pessoa".`;
    }
    return `O Google retornou HTML inesperado (HTTP ${status}). Confirme se a URL termina em /exec e está publicada para "Qualquer pessoa".`;
  }

  return null;
}

async function proxyGoogleRequest(
  targetUrl: string,
  method: 'GET' | 'POST',
  payload?: unknown
): Promise<{ ok: boolean; text?: string; message?: string }> {
  const proxyCandidates: string[] = ['/api/sheets-proxy', '/.netlify/functions/sheets-proxy'];
  const customProxy = getSafeEnvVar('VITE_SHEETS_PROXY_URL');
  if (customProxy) {
    proxyCandidates.push(customProxy);
  }
  try {
    const storedProxy = (localStorage.getItem(SHEETS_PROXY_URL_STORAGE_KEY) || '').trim();
    if (storedProxy && !proxyCandidates.includes(storedProxy)) {
      proxyCandidates.push(storedProxy);
    }
  } catch {
    // ignore storage errors
  }

  // 1. Try server-side proxy endpoints (/api/sheets-proxy, /.netlify/functions/sheets-proxy, or configured VITE_SHEETS_PROXY_URL)
  for (const proxyEndpoint of proxyCandidates) {
    try {
      const proxyRes = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, method, payload }),
      });

      if (proxyRes.status === 404 || proxyRes.status === 405) {
        continue;
      }

      const contentType = (proxyRes.headers.get('content-type') || '').toLowerCase();
      const rawText = await proxyRes.text();
      const trimmed = rawText.trim().toLowerCase();

      // Skip Netlify SPA HTML fallbacks (/* -> /index.html returning 200 text/html)
      if (!contentType.includes('application/json') && (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html'))) {
        continue;
      }

      const proxyData = JSON.parse(rawText);
      if (proxyData && typeof proxyData.ok === 'boolean') {
        return proxyData;
      }
    } catch {
      // Try next proxy candidate or fall through to direct browser fetch
    }
  }

  // 2. Fallback: Direct browser fetch (CORS-safe, omitting credentials & preflight headers)
  const normalizedTarget = normalizeAppsScriptEndpointUrl(targetUrl);
  const directOptions: RequestInit =
    method === 'POST'
      ? {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload ?? {}),
        }
      : {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
        };

  let directRes = await fetch(normalizedTarget, directOptions);
  let text = await directRes.text();
  let htmlErr = detectDirectGoogleHtmlError(text, directRes.url, directRes.status);

  if ((htmlErr || !directRes.ok) && normalizedTarget !== targetUrl) {
    try {
      const retryRes = await fetch(targetUrl, directOptions);
      const retryText = await retryRes.text();
      const retryHtmlErr = detectDirectGoogleHtmlError(retryText, retryRes.url, retryRes.status);
      if (retryRes.ok && !retryHtmlErr) {
        directRes = retryRes;
        text = retryText;
        htmlErr = null;
      }
    } catch {
      // keep initial result
    }
  }

  if (htmlErr) {
    return {
      ok: false,
      message: htmlErr,
    };
  }

  if (!directRes.ok) {
    return {
      ok: false,
      message: `HTTP ${directRes.status}: Verifique se a implantação está publicada para "Qualquer pessoa" ("Anyone").`,
    };
  }

  return { ok: true, text };
}

/**
 * Transforms any standard Google Sheets URL into a direct CSV export endpoint
 */
export function convertGoogleSheetUrlToCsvUrl(url: string): string {
  const cleanUrl = url.trim();
  if (!cleanUrl) return '';

  // Case 1: Already a CSV export or pub?output=csv
  if (cleanUrl.includes('output=csv') || cleanUrl.includes('format=csv')) {
    return cleanUrl;
  }

  // Case 2: Standard Google Sheet URL (https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID})
  const match = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    const gidMatch = cleanUrl.match(/gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return cleanUrl;
}

function normalizeUserRole(email: string, rawRole?: string): UserRole {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === 'wesley.moreira@comunidadecancaonova.com') return 'master';
  const r = (rawRole || 'cliente').toLowerCase().trim();
  if (r === 'master') return 'master';
  if (r === 'admin') return 'admin';
  if (r === 'leitor') return 'leitor';
  return 'cliente';
}

function parseActiveFlag(rawActive?: unknown): boolean {
  if (typeof rawActive === 'boolean') return rawActive;
  const val = String(rawActive ?? 'SIM').toUpperCase().trim();
  return val === '' || val === 'SIM' || val === 'TRUE' || val === '1' || val === 'ATIVO' || val === 'YES';
}

/**
 * Parses CSV lines into User objects
 * Expected columns: Nome, Email, Senha, Setor, Perfil, Ativo
 */
export function parseUsersCsv(csvText: string): (User & { password?: string; active?: boolean })[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  const parsedUsers: (User & { password?: string; active?: boolean })[] = [];

  // Determine delimiter (comma or semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // Process data lines (skip header)
  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
    if (rawCols.length < 2) continue;

    const name = rawCols[0] || 'Usuário';
    const email = (rawCols[1] || '').toLowerCase().trim();
    const password = rawCols[2] || '';
    const department = rawCols[3] || 'Canção Nova';
    const rawRole = rawCols[4] || 'cliente';
    const rawActive = rawCols[5];

    // Must be a valid email
    if (!email || !email.includes('@')) continue;

    parsedUsers.push({
      id: `sheet-${i}-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      name,
      email,
      password,
      role: normalizeUserRole(email, rawRole),
      department,
      active: parseActiveFlag(rawActive),
      source: 'sheets',
      createdAt: new Date().toISOString(),
    });
  }

  return parsedUsers;
}

/**
 * Generates the TSV / CSV template text to easily copy into Google Sheets
 */
export function getGoogleSheetsTemplateTsv(): string {
  const header = ['Nome', 'Email', 'Senha', 'Setor', 'Perfil (master / admin / cliente / leitor)', 'Ativo (SIM / NAO)'].join('\t');
  const rows = [
    ['Wesley Moreira', 'wesley.moreira@comunidadecancaonova.com', '123', 'Coordenação de Nutrição & Peregrinos', 'master', 'SIM'].join('\t'),
    ['Maria Silva', 'maria.silva@cancaonova.com', '123', 'Nutrição Clínica & Cardápios', 'admin', 'SIM'].join('\t'),
    ['Coordenação de Eventos & Retiros', 'eventos.retiros@cancaonova.com', '123', 'Eventos & Peregrinações Canção Nova', 'cliente', 'SIM'].join('\t'),
    ['Cantina & Cozinha Central', 'cantina.refeitorio@cancaonova.com', '123', 'Cozinha Central & Salão de Refeições', 'admin', 'SIM'].join('\t'),
    ['Setor de Peregrinos', 'cliente.peregrinos@cancaonova.com', '123', 'Acolhimento & Caravanas', 'cliente', 'SIM'].join('\t'),
  ];
  return [header, ...rows].join('\n');
}

/**
 * Generates the complete Google Apps Script (Code.gs) to paste inside Google Sheets > Extensions > Apps Script
 */
export function generateGoogleAppsScriptCode(): string {
  return `var SHEET_NAMES = {
  USUARIOS: 'Usuarios',
  PEDIDOS: 'Pedidos_Rampa',
  CALCULO_DIARIO: 'Calculo_Diario_Cozinha',
  CARDAPIO: 'Cardapio_Semanal',
  PRODUCAO: 'Producao_Cozinha',
  AUDITORIA: 'Auditoria'
};

// Regra de 8 dias corridos: exemplo, pedido feito dia 08/10/2026 (1o dia)
// atinge o 8o dia em 15/10/2026 (7 dias decorridos) e e apagado automaticamente.
var RETENTION_DIFF_DAYS = 7;

var HEADERS = {
  Usuarios: ['ID', 'Nome', 'Email', 'Senha', 'Setor', 'Perfil', 'Ativo', 'UltimoAcesso'],
  Pedidos_Rampa: [
    'ID_Pedido', 'Numero_Pedido', 'Data_Criacao', 'Expiracao_8_Dias', 'Cliente', 'Email',
    'Setor_Grupo', 'Dia_Semana', 'Data_Servico', 'Turno', 'Total_Pessoas',
    'Arroz_Pessoas', 'Feijao_Pessoas', 'Prato_Principal_Pessoas',
    'Guarnicao_Pessoas', 'Salada_Pessoas', 'Frutas_Solicitadas',
    'Observacoes', 'Status'
  ],
  Calculo_Diario_Cozinha: [
    'Data_Refeicao', 'Dia_Semana', 'Especificacao_Direta', 'Categoria', 'Prato_Alimento',
    'Qtd_Pedidos', 'Total_Pessoas_PAX', 'Qtd_Preparar_Cozinha',
    'Unidade', 'Base_Per_Capita'
  ],
  Cardapio_Semanal: [
    'Ano', 'Mes', 'Semana', 'Periodo', 'Tipo_Cardapio',
    'Dia_Semana', 'Data_Dia', 'Categoria', 'Prato_Preparacao',
    'Status_Cardapio', 'Atualizado_Por', 'Ultima_Atualizacao'
  ],
  Producao_Cozinha: [
    'Ano', 'Mes', 'Semana', 'Tipo_Cardapio', 'Dia_Semana',
    'Comensais_Meta', 'Categoria', 'Prato_Preparacao',
    'Quantidade', 'Unidade', 'Per_Capita_g'
  ],
  Auditoria: ['ID', 'Data_Hora', 'Usuario', 'Acao', 'Entidade', 'Detalhes']
};

// Cria menu personalizado dentro do Google Sheets ao abrir a planilha
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CardapioPro')
    .addItem('Inicializar / Verificar Abas do Sistema', 'setupPlanilhaCardapioPro')
    .addSeparator()
    .addItem('Executar Limpeza Agora (Pedidos 8+ dias)', 'limparPedidosExpirados8DiasManual')
    .addItem('Ativar Limpeza Automatica Diaria (8 dias)', 'instalarGatilhoLimpezaDiaria')
    .addToUi();
}

// Garante que todas as abas e cabecalhos existam na planilha
function setupPlanilhaCardapioPro() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var props = PropertiesService.getScriptProperties();
    var savedId = props.getProperty('CARDAPIOPRO_SHEET_ID');
    if (savedId) {
      try {
        ss = SpreadsheetApp.openById(savedId);
      } catch (e) {
        ss = null;
      }
    }
    if (!ss) {
      ss = SpreadsheetApp.create('CardapioPro_CancaoNova_BancoDeDados');
      props.setProperty('CARDAPIOPRO_SHEET_ID', ss.getId());
    }
  }

  Object.keys(HEADERS).forEach(function (tabName) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    var cols = HEADERS[tabName];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      sheet.getRange(1, 1, 1, cols.length)
        .setBackground('#065f46')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else if (tabName === SHEET_NAMES.PEDIDOS) {
      garantirColunaExpiracaoPedidos_(sheet);
    }
  });

  // Popula usuarios iniciais caso a aba Usuarios esteja vazia
  var userSheet = ss.getSheetByName(SHEET_NAMES.USUARIOS);
  if (userSheet.getLastRow() <= 1) {
    var initialUsers = [
      ['usr-wesley', 'Wesley Moreira', 'wesley.moreira@comunidadecancaonova.com', '123', 'Coordenação de Nutrição & Peregrinos', 'master', 'SIM', ''],
      ['usr-maria', 'Maria Silva', 'maria.silva@cancaonova.com', '123', 'Nutrição Clínica & Cardápios', 'admin', 'SIM', ''],
      ['usr-eventos', 'Coordenação de Eventos & Retiros', 'eventos.retiros@cancaonova.com', '123', 'Eventos & Peregrinações Canção Nova', 'cliente', 'SIM', ''],
      ['usr-cantina', 'Cantina & Cozinha Central', 'cantina.refeitorio@cancaonova.com', '123', 'Cozinha Central & Salão de Refeições', 'admin', 'SIM', ''],
      ['usr-peregrino', 'Setor de Acolhimento aos Peregrinos', 'cliente.peregrinos@cancaonova.com', '123', 'Acolhimento & Caravanas', 'cliente', 'SIM', '']
    ];
    userSheet.getRange(2, 1, initialUsers.length, initialUsers[0].length).setValues(initialUsers);
  }

  return ss;
}

// Funcao publica para ser chamada por Gatilho Diario automatico no Apps Script
function limparPedidosExpirados8Dias() {
  var ss = setupPlanilhaCardapioPro();
  return limparPedidosAntigos_(ss);
}

// Chamada manual pelo menu CardapioPro na barra superior do Google Sheets
function limparPedidosExpirados8DiasManual() {
  var ss = setupPlanilhaCardapioPro();
  var res = limparPedidosAntigos_(ss);
  var msg = res.removedCount > 0
    ? (res.removedCount + ' pedido(s) com 8+ dias apagado(s) automaticamente: ' + res.removedNumbers.join(', '))
    : 'Nenhum pedido atingiu o 8o dia (ex: 08/10 -> 15/10) ate o momento.';
  try {
    SpreadsheetApp.getUi().alert('Regra de Limpeza (8 Dias)', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    // Sem UI ativa
  }
  return res;
}

// Instala gatilho diario automatico (roda todo dia entre 01h e 02h mesmo com o app fechado)
function instalarGatilhoLimpezaDiaria() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'limparPedidosExpirados8Dias') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('limparPedidosExpirados8Dias')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();

  var res = limparPedidosExpirados8Dias();
  try {
    SpreadsheetApp.getUi().alert(
      'Limpeza Automatica Ativada',
      'Gatilho diario configurado! Todo dia a partir de 01h da manha, pedidos que atingirem o 8o dia (ex: pedido dia 08/10 -> apagado dia 15/10) serao removidos automaticamente. Limpeza inicial removida agora: ' + res.removedCount + ' pedido(s).',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {
    // Sem UI ativa
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Endpoint GET: Leitura em tempo real de usuarios e verificacao de conexao
// Exemplos: ?action=ping | ?action=getUsers | ?action=syncAll | ?action=cleanupOrders
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : 'getUsers';
    var ss = setupPlanilhaCardapioPro();
    var cleanup = limparPedidosAntigos_(ss);

    if (action === 'ping') {
      return jsonResponse({
        ok: true,
        service: 'CardapioPro Apps Script',
        sheetName: ss.getName(),
        sheetId: ss.getId(),
        cleanup: cleanup,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'cleanupOrders') {
      return jsonResponse({
        ok: true,
        sheetName: ss.getName(),
        cleanup: cleanup,
        syncedAt: new Date().toISOString()
      });
    }

    if (action === 'getUsers' || action === 'syncAll') {
      var users = readUsersFromSheet_(ss);
      var orders = action === 'syncAll' ? readRowsAsObjects_(ss.getSheetByName(SHEET_NAMES.PEDIDOS)) : [];
      return jsonResponse({
        ok: true,
        sheetName: ss.getName(),
        users: users,
        orders: orders,
        cleanup: cleanup,
        count: users.length,
        syncedAt: new Date().toISOString()
      });
    }

    return jsonResponse({ ok: false, message: 'Acao GET desconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, message: err.toString() });
  }
}

// Endpoint POST: Recebe atualizacoes do app (pedidos, usuarios, cardapio, producao)
function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var body = JSON.parse(raw);
    var action = body.action || 'syncAll';
    var ss = setupPlanilhaCardapioPro();

    if (action === 'testConnection') {
      var testCleanup = limparPedidosAntigos_(ss);
      return jsonResponse({
        ok: true,
        message: 'Conexao POST confirmada com a planilha "' + ss.getName() + '".',
        sheetName: ss.getName(),
        cleanup: testCleanup,
        syncedAt: new Date().toISOString()
      });
    }

    if (action === 'cleanupOrders') {
      var manualCleanup = limparPedidosAntigos_(ss);
      return jsonResponse({
        ok: true,
        message: manualCleanup.removedCount > 0
          ? (manualCleanup.removedCount + ' pedido(s) expirado(s) (8+ dias) removido(s) da planilha.')
          : 'Nenhum pedido atingiu 8 dias para exclusao.',
        cleanup: manualCleanup,
        syncedAt: new Date().toISOString()
      });
    }

    if (action === 'upsertUser' && body.user) {
      upsertUserRow_(ss, body.user);
      return jsonResponse({
        ok: true,
        message: 'Usuario sincronizado na aba Usuarios.',
        syncedAt: new Date().toISOString()
      });
    }

    if (action === 'upsertOrder' && body.order) {
      upsertOrderRow_(ss, body.order);
      var orderCleanup = limparPedidosAntigos_(ss);
      return jsonResponse({
        ok: true,
        message: 'Pedido ' + (body.order.orderNumber || '') + ' gravado na aba Pedidos_Rampa.',
        cleanup: orderCleanup,
        syncedAt: new Date().toISOString()
      });
    }

    if (action === 'syncAll') {
      var counts = {};
      if (Array.isArray(body.users) && body.users.length > 0) {
        counts.users = writeUsersMerge_(ss, body.users);
      }
      if (Array.isArray(body.orders)) {
        var activeOrdersOnly = body.orders.filter(function (ord) {
          var refDate = parseDataPedido_(ord.orderDate || ord.createdAt || ord.serviceDate);
          return !isPedidoExpirado8Dias_(refDate);
        });
        counts.orders = replaceTableRows_(ss.getSheetByName(SHEET_NAMES.PEDIDOS), HEADERS.Pedidos_Rampa, activeOrdersOnly.map(formatOrderRow_));
      }
      if (Array.isArray(body.dailyCalcRows)) {
        counts.dailyCalcRows = replaceTableRows_(ss.getSheetByName(SHEET_NAMES.CALCULO_DIARIO), HEADERS.Calculo_Diario_Cozinha, body.dailyCalcRows);
      }
      if (Array.isArray(body.menuRows)) {
        counts.menuRows = replaceTableRows_(ss.getSheetByName(SHEET_NAMES.CARDAPIO), HEADERS.Cardapio_Semanal, body.menuRows);
      }
      if (Array.isArray(body.productionRows)) {
        counts.productionRows = replaceTableRows_(ss.getSheetByName(SHEET_NAMES.PRODUCAO), HEADERS.Producao_Cozinha, body.productionRows);
      }
      if (Array.isArray(body.auditRows)) {
        counts.auditRows = replaceTableRows_(ss.getSheetByName(SHEET_NAMES.AUDITORIA), HEADERS.Auditoria, body.auditRows);
      }

      var syncCleanup = limparPedidosAntigos_(ss);
      return jsonResponse({
        ok: true,
        message: 'Sincronizacao completa gravada na planilha "' + ss.getName() + '"!',
        sheetName: ss.getName(),
        counts: counts,
        cleanup: syncCleanup,
        syncedAt: new Date().toISOString()
      });
    }

    return jsonResponse({ ok: false, message: 'Acao POST nao reconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, message: 'Erro no Apps Script doPost: ' + err.toString() });
  }
}

// ==================== FUNCOES AUXILIARES ====================

function readUsersFromSheet_(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.USUARIOS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });

  // Detecta índices dinamicamente pelos nomes das colunas
  var idxId = findCol_(headers, ['id']);
  var idxName = findCol_(headers, ['nome', 'name']);
  var idxEmail = findCol_(headers, ['email', 'e-mail']);
  var idxPass = findCol_(headers, ['senha', 'password']);
  var idxDept = findCol_(headers, ['setor', 'departamento', 'department']);
  var idxRole = findCol_(headers, ['perfil', 'role']);
  var idxActive = findCol_(headers, ['ativo', 'active', 'status']);

  // Fallback para ordem padrão caso planilha use ordem simples Nome | Email | Senha | Setor | Perfil | Ativo
  if (idxEmail === -1 && headers.length >= 2) {
    idxName = 0; idxEmail = 1; idxPass = 2; idxDept = 3; idxRole = 4; idxActive = 5;
  }

  var users = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var email = idxEmail >= 0 ? String(row[idxEmail] || '').toLowerCase().trim() : '';
    if (!email || email.indexOf('@') === -1) continue;

    users.push({
      id: (idxId >= 0 && row[idxId]) ? String(row[idxId]) : ('gs-' + i + '-' + email.replace(/[^a-z0-9]/g, '')),
      name: idxName >= 0 ? String(row[idxName] || 'Usuário') : 'Usuário',
      email: email,
      password: idxPass >= 0 ? String(row[idxPass] || '') : '',
      department: idxDept >= 0 ? String(row[idxDept] || 'Canção Nova') : 'Canção Nova',
      role: idxRole >= 0 ? String(row[idxRole] || 'cliente').toLowerCase().trim() : 'cliente',
      active: idxActive >= 0 ? String(row[idxActive] || 'SIM').toUpperCase().trim() : 'SIM'
    });
  }
  return users;
}

function findCol_(headers, aliases) {
  for (var i = 0; i < headers.length; i++) {
    for (var j = 0; j < aliases.length; j++) {
      if (headers[i] === aliases[j] || headers[i].indexOf(aliases[j]) === 0) {
        return i;
      }
    }
  }
  return -1;
}

function writeUsersMerge_(ss, appUsers) {
  var sheet = ss.getSheetByName(SHEET_NAMES.USUARIOS);
  var existing = readUsersFromSheet_(ss);
  var mapByEmail = {};

  // Mantém senhas/configurações já editadas diretamente no Sheets como prioridade quando existirem
  existing.forEach(function (u) {
    mapByEmail[u.email] = u;
  });

  appUsers.forEach(function (u) {
    var em = String(u.email || '').toLowerCase().trim();
    if (!em) return;
    if (!mapByEmail[em]) {
      mapByEmail[em] = {
        id: u.id || ('usr-' + em),
        name: u.name || 'Usuário',
        email: em,
        password: u.password || '123',
        department: u.department || 'Canção Nova',
        role: u.role || 'cliente',
        active: u.active === false ? 'NAO' : 'SIM',
        lastLogin: u.lastLogin || ''
      };
    } else {
      mapByEmail[em].lastLogin = u.lastLogin || mapByEmail[em].lastLogin || '';
    }
  });

  var rows = Object.keys(mapByEmail).map(function (em) {
    var u = mapByEmail[em];
    return [
      u.id || '',
      u.name || '',
      u.email || '',
      u.password || '123',
      u.department || '',
      u.role || 'cliente',
      u.active || 'SIM',
      u.lastLogin || ''
    ];
  });

  return replaceTableRows_(sheet, HEADERS.Usuarios, rows);
}

function upsertUserRow_(ss, user) {
  var sheet = ss.getSheetByName(SHEET_NAMES.USUARIOS);
  var email = String(user.email || '').toLowerCase().trim();
  if (!email) return;

  var data = sheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2] || '').toLowerCase().trim() === email) {
      foundRow = i + 1;
      break;
    }
  }

  var rowValues = [
    user.id || ('usr-' + Date.now()),
    user.name || '',
    email,
    user.password || '123',
    user.department || 'Canção Nova',
    user.role || 'cliente',
    user.active === false ? 'NAO' : 'SIM',
    user.lastLogin || ''
  ];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function formatOrderRow_(order) {
  var items = Array.isArray(order.mealItems) ? order.mealItems : [];
  function countCat(cats) {
    var total = 0;
    items.forEach(function (it) {
      if (cats.indexOf(String(it.category || '').toLowerCase()) !== -1) {
        total += Number(it.peopleCount || 0);
      }
    });
    return total;
  }

  var frutasTxt = Array.isArray(order.fruits)
    ? order.fruits.map(function (f) { return f.name + ': ' + f.quantity + ' ' + f.unit; }).join(' | ')
    : '';

  var refDate = parseDataPedido_(order.orderDate || order.createdAt || order.serviceDate);
  var expiracaoBr = refDate ? calcularExpiracao8DiasBr_(refDate) : '';

  return [
    order.id || '',
    order.orderNumber || '',
    order.orderDate || order.createdAt || '',
    expiracaoBr,
    order.clientName || '',
    order.clientEmail || '',
    order.departmentOrGroup || '',
    order.dayName || '',
    order.serviceDate || '',
    order.mealShift || 'Almoço',
    Number(order.numberOfPeople || 0),
    countCat(['arroz']),
    countCat(['feijao']),
    countCat(['principal']),
    countCat(['guarnicao']),
    countCat(['salada']),
    frutasTxt,
    order.specialDietNotes || '',
    order.status || 'solicitado'
  ];
}

function garantirColunaExpiracaoPedidos_(sheet) {
  if (!sheet || sheet.getLastRow() === 0) return;
  var headerRow = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  var headersLower = headerRow.map(function (h) { return String(h).toLowerCase().trim(); });
  var idxExp = findCol_(headersLower, ['expiracao_8_dias', 'auto_exclusao']);
  if (idxExp === -1) {
    // Insere coluna Expiracao_8_Dias logo apos Data_Criacao (Coluna D / 4)
    sheet.insertColumnAfter(3);
    sheet.getRange(1, 4).setValue('Expiracao_8_Dias')
      .setBackground('#065f46')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    idxExp = 3;
  }

  // Preenche automaticamente linhas existentes que ainda nao possuem o prazo calculado
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var allData = sheet.getDataRange().getValues();
    var hLower = allData[0].map(function (h) { return String(h).toLowerCase().trim(); });
    var idxCriacao = findCol_(hLower, ['data_criacao', 'data_solicitacao', 'created']);
    if (idxCriacao === -1) idxCriacao = 2;
    var idxServico = findCol_(hLower, ['data_servico', 'data_refeicao']);
    if (idxServico === -1) idxServico = 8;

    for (var r = 1; r < allData.length; r++) {
      var atual = String(allData[r][idxExp] || '').trim();
      if (!atual) {
        var refD = parseDataPedido_(allData[r][idxCriacao]) || parseDataPedido_(allData[r][idxServico]);
        if (refD) {
          sheet.getRange(r + 1, idxExp + 1).setValue(calcularExpiracao8DiasBr_(refD));
        }
      }
    }
  }
}

function upsertOrderRow_(ss, order) {
  var sheet = ss.getSheetByName(SHEET_NAMES.PEDIDOS);
  var rowValues = formatOrderRow_(order);
  var data = sheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '') === String(order.id || '')) {
      foundRow = i + 1;
      break;
    }
  }
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.insertRowAfter(1);
    sheet.getRange(2, 1, 1, rowValues.length).setValues([rowValues]);
  }
}

// ==================== REGRA DE AUTO-EXCLUSAO (8 DIAS) ====================

function parseDataPedido_(rawVal) {
  if (!rawVal) return null;
  if (Object.prototype.toString.call(rawVal) === '[object Date]') {
    if (isNaN(rawVal.getTime())) return null;
    return new Date(rawVal.getFullYear(), rawVal.getMonth(), rawVal.getDate());
  }
  var s = String(rawVal).trim();
  if (!s) return null;

  var isoMatch = s.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  var brMatch = s.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2,4})/);
  if (brMatch) {
    var yr = Number(brMatch[3]);
    if (yr < 100) yr += 2000;
    return new Date(yr, Number(brMatch[2]) - 1, Number(brMatch[1]));
  }

  var parsed = new Date(s);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function formatarDataBr_(d) {
  var dd = ('0' + d.getDate()).slice(-2);
  var mm = ('0' + (d.getMonth() + 1)).slice(-2);
  return dd + '/' + mm + '/' + d.getFullYear();
}

function calcularExpiracao8DiasBr_(refDate) {
  var exp = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() + RETENTION_DIFF_DAYS);
  return 'Apaga em ' + formatarDataBr_(exp) + ' (8o dia)';
}

function isPedidoExpirado8Dias_(refDate) {
  if (!refDate) return false;
  var agora = new Date();
  var hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  var diffDays = Math.floor((hoje.getTime() - refDate.getTime()) / 86400000);
  return diffDays >= RETENTION_DIFF_DAYS;
}

function limparPedidosAntigos_(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.PEDIDOS);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { removedCount: 0, removedNumbers: [] };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function (h) { return String(h).toLowerCase().trim(); });
  var idxCriacao = findCol_(headers, ['data_criacao', 'data_solicitacao', 'created']);
  if (idxCriacao === -1) idxCriacao = 2;
  var idxServico = findCol_(headers, ['data_servico', 'data_refeicao']);
  if (idxServico === -1) idxServico = 8;
  var idxNumero = findCol_(headers, ['numero_pedido', 'protocolo']);
  if (idxNumero === -1) idxNumero = 1;
  var idxCliente = findCol_(headers, ['cliente', 'usuario']);
  if (idxCliente === -1) idxCliente = 4;

  var expiredRows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var refDate = parseDataPedido_(row[idxCriacao]) || parseDataPedido_(row[idxServico]);
    if (isPedidoExpirado8Dias_(refDate)) {
      expiredRows.push({
        rowIndex: i + 1,
        refTime: refDate ? refDate.getTime() : 0,
        refBr: refDate ? formatarDataBr_(refDate) : '',
        numero: String(row[idxNumero] || ('Linha ' + (i + 1))),
        cliente: String(row[idxCliente] || '')
      });
    }
  }

  if (expiredRows.length === 0) {
    return { removedCount: 0, removedNumbers: [] };
  }

  // Ordena mais antigo primeiro para registro cronologico (primeiro pedido primeiro)
  expiredRows.sort(function (a, b) { return a.refTime - b.refTime; });
  var removedNumbers = expiredRows.map(function (item) { return item.numero; });

  // Apaga de baixo para cima para preservar os indices das linhas
  var descRows = expiredRows.slice().sort(function (a, b) { return b.rowIndex - a.rowIndex; });
  for (var k = 0; k < descRows.length; k++) {
    sheet.deleteRow(descRows[k].rowIndex);
  }

  // Registra na aba Auditoria
  var auditSheet = ss.getSheetByName(SHEET_NAMES.AUDITORIA);
  if (auditSheet) {
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
    for (var m = 0; m < expiredRows.length; m++) {
      var item = expiredRows[m];
      auditSheet.insertRowAfter(1);
      auditSheet.getRange(2, 1, 1, 6).setValues([[
        'auto-del-' + Date.now() + '-' + m,
        nowStr,
        'Sistema (Regra 8 Dias)',
        'AUTO_EXCLUSAO_8_DIAS',
        'Pedidos_Rampa',
        'Pedido ' + item.numero + ' (' + item.cliente + ') criado em ' + item.refBr + ' atingiu o 8o dia e foi apagado automaticamente.'
      ]]);
    }
  }

  return {
    removedCount: expiredRows.length,
    removedNumbers: removedNumbers
  };
}

function replaceTableRows_(sheet, headerCols, rows) {
  if (!sheet) return 0;
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, Math.max(headerCols.length, sheet.getLastColumn())).clearContent();
  }
  if (rows && rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headerCols.length).setValues(rows);
  }
  return rows ? rows.length : 0;
}

function readRowsAsObjects_(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[String(headers[c])] = data[i][c];
    }
    out.push(obj);
  }
  return out;
}
`;
}

/**
 * Fetches users from a deployed Google Apps Script Web App URL (?action=getUsers)
 */
export async function fetchUsersViaAppsScript(scriptUrl: string): Promise<{
  success: boolean;
  users: (User & { password?: string; active?: boolean })[];
  count: number;
  sheetName?: string;
  message: string;
}> {
  const validation = validateAppsScriptEndpoint(scriptUrl);
  if (!validation.valid) {
    return {
      success: false,
      users: [],
      count: 0,
      message: validation.error || 'Informe uma URL válida do Google Apps Script Web App (/exec).',
    };
  }

  const clean = validation.cleanUrl;
  const separator = clean.includes('?') ? '&' : '?';
  const endpoint = `${clean}${separator}action=getUsers&_t=${Date.now()}`;

  try {
    const proxyResult = await proxyGoogleRequest(endpoint, 'GET');
    if (!proxyResult.ok || proxyResult.text === undefined) {
      throw new Error(proxyResult.message || 'O Apps Script não retornou dados.');
    }

    let data: any;
    try {
      data = JSON.parse(proxyResult.text);
    } catch {
      throw new Error('A resposta do Apps Script não veio em formato JSON. Confirme se o código Code.gs foi salvo e implantado como Web App (/exec) com acesso "Qualquer pessoa".');
    }

    if (!data || !data.ok) {
      throw new Error(data?.message || 'O Apps Script retornou um erro ao ler os usuários.');
    }

    const rawUsers = Array.isArray(data.users) ? data.users : [];
    const parsedUsers: (User & { password?: string; active?: boolean })[] = rawUsers
      .filter((u: any) => u && u.email && String(u.email).includes('@'))
      .map((u: any, idx: number) => {
        const email = String(u.email).toLowerCase().trim();
        return {
          id: String(u.id || `gs-${idx + 1}-${email.replace(/[^a-zA-Z0-9]/g, '')}`),
          name: String(u.name || 'Usuário'),
          email,
          password: String(u.password || ''),
          department: String(u.department || 'Canção Nova'),
          role: normalizeUserRole(email, u.role),
          active: parseActiveFlag(u.active),
          source: 'apps_script' as const,
          createdAt: new Date().toISOString(),
        };
      });

    if (parsedUsers.length === 0) {
      throw new Error('Conexão OK, mas nenhum usuário válido foi encontrado na aba "Usuarios" da planilha.');
    }

    try {
      localStorage.setItem(EXTERNAL_USERS_CACHE_KEY, JSON.stringify(parsedUsers));
      localStorage.setItem(LAST_SYNC_STORAGE_KEY, new Date().toISOString());
      localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, clean);
    } catch (e) {
      console.warn('Could not cache users:', e);
    }

    return {
      success: true,
      users: parsedUsers,
      count: parsedUsers.length,
      sheetName: data.sheetName,
      message: `Apps Script conectado com a planilha "${data.sheetName || 'Google Sheets'}"! ${parsedUsers.length} usuários sincronizados.`,
    };
  } catch (err: any) {
    console.error('Apps Script GET error:', err);
    return {
      success: false,
      users: [],
      count: 0,
      message: formatFriendlyFetchError(err, 'Google Apps Script'),
    };
  }
}

export interface AppsScriptFullSyncPayload {
  users: User[];
  orders: ClientRampaOrder[];
  spreadsheet: SystemSpreadsheet;
}

/**
 * Pushes full system data (Users, Orders, Weekly Menus, Production, Audit) to Google Apps Script via POST
 */
export async function pushFullSyncToAppsScript(
  scriptUrl: string,
  payload: AppsScriptFullSyncPayload
): Promise<{ success: boolean; message: string; sheetName?: string }> {
  const validation = validateAppsScriptEndpoint(scriptUrl);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.error || 'Informe uma URL válida do Google Apps Script Web App (/exec).',
    };
  }

  const clean = validation.cleanUrl;

  const menuRows = (payload.spreadsheet.sheets.cardapios?.rows || []).map((r) => [
    r.Ano ?? '',
    r.Mes ?? '',
    r.Semana ?? '',
    r.Periodo ?? '',
    r.Tipo_Cardapio ?? '',
    r.Dia_Semana ?? '',
    r.Data_Dia ?? '',
    r.Categoria_Nome ?? '',
    r.Prato_Preparacao ?? '',
    r.Status_Cardapio ?? '',
    r.Atualizado_Por ?? '',
    r.Ultima_Atualizacao ?? '',
  ]);

  const productionRows = (payload.spreadsheet.sheets.producao?.rows || []).map((r) => [
    r.Ano ?? '',
    r.Mes ?? '',
    r.Semana ?? '',
    r.Tipo_Cardapio ?? '',
    r.Dia_Semana ?? '',
    r.Comensais_Dia ?? '',
    r.Categoria ?? '',
    r.Prato_Preparacao ?? '',
    r.Quantidade ?? '',
    r.Unidade ?? '',
    r.Per_Capita_g ?? '',
  ]);

  const auditRows = (payload.spreadsheet.sheets.auditoria?.rows || []).slice(0, 100).map((r) => [
    r.ID ?? '',
    r.Data_Hora ?? '',
    r.Usuario ?? '',
    r.Acao ?? '',
    r.Entidade ?? '',
    r.Detalhes ?? '',
  ]);

  const dailyCalcRows = (payload.spreadsheet.sheets.calculoDiario?.rows || []).map((r) => [
    r.Data_Refeicao ?? '',
    r.Dia_Semana ?? '',
    r.Especificacao_Direta ?? '',
    r.Categoria ?? '',
    r.Prato_Alimento ?? '',
    r.Qtd_Pedidos ?? 0,
    r.Total_Pessoas_PAX ?? 0,
    r.Qtd_Preparar_Cozinha ?? 0,
    r.Unidade ?? '',
    r.Base_Per_Capita ?? '',
  ]);

  try {
    const proxyResult = await proxyGoogleRequest(clean, 'POST', {
      action: 'syncAll',
      users: payload.users,
      orders: payload.orders,
      dailyCalcRows,
      menuRows,
      productionRows,
      auditRows,
    });

    if (!proxyResult.ok || proxyResult.text === undefined) {
      throw new Error(proxyResult.message || 'Não foi possível gravar na planilha via Apps Script.');
    }

    let data: any;
    try {
      data = JSON.parse(proxyResult.text);
    } catch {
      throw new Error('O Apps Script respondeu em formato inesperado (não JSON). Confira se a função doPost(e) está correta e se a implantação está publicada para "Qualquer pessoa".');
    }

    if (!data || !data.ok) {
      throw new Error(data?.message || 'Apps Script retornou erro ao gravar dados.');
    }

    try {
      localStorage.setItem(LAST_APPS_SCRIPT_SYNC_KEY, new Date().toISOString());
      localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, clean);
    } catch (e) {
      console.warn(e);
    }

    return {
      success: true,
      sheetName: data.sheetName,
      message: data.message || 'Dados sincronizados com sucesso no Google Sheets!',
    };
  } catch (err: any) {
    console.error('Apps Script POST syncAll error:', err);
    return {
      success: false,
      message: formatFriendlyFetchError(err, 'Google Apps Script'),
    };
  }
}

/**
 * Pushes a single client order to Google Sheets via Apps Script (background auto-sync)
 */
export async function pushSingleOrderToAppsScript(
  scriptUrl: string,
  order: ClientRampaOrder
): Promise<{ success: boolean; message?: string }> {
  const validation = validateAppsScriptEndpoint(scriptUrl);
  if (!validation.valid) return { success: false };

  try {
    const proxyResult = await proxyGoogleRequest(validation.cleanUrl, 'POST', {
      action: 'upsertOrder',
      order,
    });
    if (!proxyResult.ok || !proxyResult.text) return { success: false, message: proxyResult.message };
    const data = JSON.parse(proxyResult.text);
    if (data?.ok) {
      localStorage.setItem(LAST_APPS_SCRIPT_SYNC_KEY, new Date().toISOString());
      return { success: true, message: data.message };
    }
    return { success: false, message: data?.message };
  } catch (e) {
    console.warn('Background Apps Script order push failed:', e);
    return { success: false };
  }
}

/**
 * Pushes a single user record to Google Sheets via Apps Script (background auto-sync)
 */
export async function pushSingleUserToAppsScript(
  scriptUrl: string,
  user: User
): Promise<{ success: boolean; message?: string }> {
  const validation = validateAppsScriptEndpoint(scriptUrl);
  if (!validation.valid) return { success: false };

  try {
    const proxyResult = await proxyGoogleRequest(validation.cleanUrl, 'POST', {
      action: 'upsertUser',
      user,
    });
    if (!proxyResult.ok || !proxyResult.text) return { success: false, message: proxyResult.message };
    const data = JSON.parse(proxyResult.text);
    if (data?.ok) {
      localStorage.setItem(LAST_APPS_SCRIPT_SYNC_KEY, new Date().toISOString());
      return { success: true, message: data.message };
    }
    return { success: false, message: data?.message };
  } catch (e) {
    console.warn('Background Apps Script user push failed:', e);
    return { success: false };
  }
}

/**
 * Fetches users from external Google Sheet URL (auto-detects Apps Script Web App OR CSV link)
 */
export async function syncUsersFromExternalSheet(sheetUrl: string): Promise<{
  success: boolean;
  users: (User & { password?: string; active?: boolean })[];
  count: number;
  message: string;
}> {
  if (!sheetUrl || !sheetUrl.trim()) {
    return {
      success: false,
      users: [],
      count: 0,
      message: 'Nenhuma URL de planilha ou Apps Script configurada.',
    };
  }

  // If user pasted an Apps Script Web App URL, use the Apps Script JSON endpoint directly
  if (isAppsScriptUrl(sheetUrl)) {
    return fetchUsersViaAppsScript(sheetUrl);
  }

  const csvUrl = convertGoogleSheetUrlToCsvUrl(sheetUrl);

  try {
    const proxyResult = await proxyGoogleRequest(csvUrl, 'GET');
    if (!proxyResult.ok || proxyResult.text === undefined) {
      throw new Error(
        proxyResult.message ||
          'Erro ao acessar planilha Google: Verifique se a planilha está compartilhada como "Qualquer pessoa com o link pode ler" ou "Publicada na Web".'
      );
    }

    const csvText = proxyResult.text;
    const parsedUsers = parseUsersCsv(csvText);

    if (parsedUsers.length === 0) {
      throw new Error('A planilha foi acessada, mas nenhuma linha de usuário válida foi encontrada. Verifique as colunas do cabeçalho: Nome, Email, Senha, Setor, Perfil, Ativo.');
    }

    // Cache locally
    try {
      localStorage.setItem(EXTERNAL_USERS_CACHE_KEY, JSON.stringify(parsedUsers));
      localStorage.setItem(LAST_SYNC_STORAGE_KEY, new Date().toISOString());
      localStorage.setItem(EXTERNAL_SHEET_URL_STORAGE_KEY, sheetUrl);
    } catch (e) {
      console.warn('Could not cache external users in localStorage:', e);
    }

    return {
      success: true,
      users: parsedUsers,
      count: parsedUsers.length,
      message: `Sincronização bem-sucedida! ${parsedUsers.length} usuários carregados diretamente da sua planilha Google Sheets.`,
    };
  } catch (err: any) {
    console.error('Failed to sync users from Google Sheets:', err);
    return {
      success: false,
      users: [],
      count: 0,
      message: formatFriendlyFetchError(err, 'Google Sheets (CSV)'),
    };
  }
}

/**
 * Loads current cached users or defaults
 */
export function getLoadedExternalUsers(): (User & { password?: string; active?: boolean })[] {
  try {
    const cached = localStorage.getItem(EXTERNAL_USERS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(e);
  }
  return INITIAL_EXTERNAL_USERS;
}

/**
 * Strictly authenticates user against the registered database:
 * 1. Checks domain (@cancaonova.com or @comunidadecancaonova.com)
 * 2. Checks if email is in the external database
 * 3. Checks if user is active
 * 4. Checks if password matches
 */
export function authenticateUserWithSheet(
  email: string,
  password: string,
  userDatabase: (User & { password?: string; active?: boolean })[]
): {
  success: boolean;
  user?: User;
  message?: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // 1. Mandatory Domain Check
  if (!isValidCancaoNovaEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Acesso restrito: Somente e-mails corporativos válidos com o domínio @cancaonova.com ou @comunidadecancaonova.com são autorizados a entrar no sistema.',
    };
  }

  // 2. Existence Check in Database
  const found = userDatabase.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!found) {
    return {
      success: false,
      message: `O e-mail "${cleanEmail}" não consta na planilha do banco de dados de usuários cadastrados. Solicite ao Administrador MASTER que adicione seu e-mail e senha na planilha.`,
    };
  }

  // 3. Active Status Check
  if (found.active === false) {
    return {
      success: false,
      message: `O acesso para o e-mail "${cleanEmail}" está marcado como DESATIVADO na planilha de controle de usuários.`,
    };
  }

  // 4. Password Check
  const expectedPassword = found.password || '';
  if (expectedPassword && expectedPassword !== cleanPassword) {
    return {
      success: false,
      message: 'Senha incorreta para este usuário. Verifique a senha cadastrada na planilha externa ou com o Administrador.',
    };
  }

  // 5. Success
  const assignedRole: UserRole = cleanEmail === 'wesley.moreira@comunidadecancaonova.com' ? 'master' : found.role;
  const authenticatedUser: User = {
    id: found.id,
    name: found.name,
    email: found.email,
    role: assignedRole,
    department: found.department || 'Restaurante Canção Nova',
    avatar: found.avatar,
    createdAt: found.createdAt,
    lastLogin: new Date().toISOString(),
  };

  return {
    success: true,
    user: authenticatedUser,
  };
}

/**
 * Triggers automatic 8-day order cleanup on the connected Google Apps Script sheet
 */
export async function triggerAppsScriptCleanup(scriptUrl: string): Promise<{
  success: boolean;
  removedCount: number;
  message?: string;
}> {
  const validation = validateAppsScriptEndpoint(scriptUrl);
  if (!validation.valid) {
    return { success: false, removedCount: 0 };
  }

  try {
    const proxyResult = await proxyGoogleRequest(validation.cleanUrl, 'POST', {
      action: 'cleanupOrders',
    });
    if (!proxyResult.ok || !proxyResult.text) {
      return { success: false, removedCount: 0, message: proxyResult.message };
    }
    const data = JSON.parse(proxyResult.text);
    const removedCount = Number(data?.cleanup?.removedCount || 0);
    return {
      success: Boolean(data?.ok),
      removedCount,
      message: data?.message,
    };
  } catch (e) {
    console.warn('Apps Script cleanup request failed:', e);
    return { success: false, removedCount: 0 };
  }
}
