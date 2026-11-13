const ALLOWED_PROXY_HOSTS = new Set([
  'script.google.com',
  'script.googleusercontent.com',
  'docs.google.com',
  'accounts.google.com',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

function isAllowedGoogleUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && ALLOWED_PROXY_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function normalizeAppsScriptUrl(rawUrl) {
  try {
    const u = new URL(rawUrl.trim());
    if (u.hostname === 'script.google.com') {
      u.pathname = u.pathname.replace(/^\/a\/macros\/[^/]+\/s\//i, '/macros/s/');
      u.pathname = u.pathname.replace(/^\/macros\/u\/\d+\/s\//i, '/macros/s/');
    }
    return u.toString();
  } catch {
    return (rawUrl || '').trim();
  }
}

function extractHtmlSummary(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return title || stripped.slice(0, 140);
}

function detectGoogleAuthOrPermissionHtml(bodyText, finalUrl, status) {
  const lowerUrl = (finalUrl || '').toLowerCase();
  const lowerBody = (bodyText || '').toLowerCase();
  const trimmed = (bodyText || '').trim().toLowerCase();

  if (lowerUrl.includes('accounts.google.com') || lowerUrl.includes('servicelogin')) {
    return 'O Google redirecionou para a tela de login (accounts.google.com). No Apps Script, abra Implantar > Gerenciar implantações > Editar (lápis), defina "Executar como: Eu" e "Quem pode acessar: Qualquer pessoa".';
  }

  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    if (
      lowerBody.includes('accounts.google.com') ||
      lowerBody.includes('servicelogin') ||
      lowerBody.includes('sign in') ||
      lowerBody.includes('fazer login')
    ) {
      return 'O Apps Script ou a Planilha exige login Google. Em "Implantar > Gerenciar implantações", configure "Executar como: Eu" e "Quem pode acessar: Qualquer pessoa".';
    }
    if (lowerBody.includes('script function not found')) {
      return 'Função doGet/doPost não encontrada no Apps Script. Salve (Ctrl+S) o código completo e crie uma Nova Versão em Gerenciar implantações.';
    }
    if (
      lowerBody.includes('desculpe') ||
      lowerBody.includes('sorry, unable to open') ||
      lowerBody.includes('não foi possível abrir') ||
      lowerBody.includes('page not found')
    ) {
      return `O Google retornou "Não foi possível abrir o arquivo" (HTTP ${status}). Causas comuns: (1) "Executar como" não está como "Eu"; (2) "Quem pode acessar" não está como "Qualquer pessoa"; (3) A organização Workspace bloqueia Web Apps públicos.`;
    }
    const summary = extractHtmlSummary(bodyText);
    return `O Google retornou HTML inesperado (HTTP ${status}${summary ? `: "${summary}"` : ''}). Confirme se a URL termina em /exec e se o acesso está como "Qualquer pessoa".`;
  }

  return null;
}

async function fetchWithGoogleRedirects(initialUrl, initialMethod, payload) {
  let currentUrl = initialUrl;
  let currentMethod = initialMethod;
  let currentBody = initialMethod === 'POST' ? JSON.stringify(payload ?? {}) : undefined;
  const cookies = [];

  for (let hop = 0; hop < 8; hop++) {
    if (!isAllowedGoogleUrl(currentUrl)) {
      throw new Error(`Redirecionamento para host não autorizado: ${currentUrl}`);
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      Accept: 'application/json, text/csv, text/plain, */*',
    };

    if (currentMethod === 'POST' && currentBody !== undefined) {
      headers['Content-Type'] = 'text/plain;charset=utf-8';
    }
    if (cookies.length > 0) {
      headers['Cookie'] = cookies.join('; ');
    }

    const res = await fetch(currentUrl, {
      method: currentMethod,
      redirect: 'manual',
      headers,
      body: currentMethod === 'POST' ? currentBody : undefined,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const firstPart = setCookie.split(';')[0]?.trim();
      if (firstPart) cookies.push(firstPart);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        const text = await res.text();
        return { status: res.status, finalUrl: currentUrl, text };
      }
      currentUrl = new URL(location, currentUrl).toString();
      if (res.status === 301 || res.status === 302 || res.status === 303) {
        currentMethod = 'GET';
        currentBody = undefined;
      }
      continue;
    }

    const text = await res.text();
    return { status: res.status, finalUrl: currentUrl, text };
  }

  throw new Error('Muitos redirecionamentos ao tentar acessar o Google Apps Script.');
}

function jsonResponse(statusCode, bodyObj) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(bodyObj),
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      ok: false,
      message: 'Método não permitido. Utilize POST para o proxy da planilha.',
    });
  }

  try {
    const parsedBody = event.body ? JSON.parse(event.body) : {};
    const rawUrl = typeof parsedBody?.url === 'string' ? parsedBody.url.trim() : '';
    const method = parsedBody?.method === 'POST' ? 'POST' : 'GET';
    const payload = parsedBody?.payload;

    if (!rawUrl || !isAllowedGoogleUrl(rawUrl)) {
      return jsonResponse(400, {
        ok: false,
        message: 'URL inválida. Apenas URLs HTTPS oficiais do Google Sheets ou Google Apps Script são permitidas.',
      });
    }

    const normalizedUrl = normalizeAppsScriptUrl(rawUrl);
    let result = await fetchWithGoogleRedirects(normalizedUrl, method, payload);
    let authError = detectGoogleAuthOrPermissionHtml(result.text, result.finalUrl, result.status);

    if (authError && normalizedUrl !== rawUrl) {
      const retryResult = await fetchWithGoogleRedirects(rawUrl, method, payload);
      const retryAuthError = detectGoogleAuthOrPermissionHtml(
        retryResult.text,
        retryResult.finalUrl,
        retryResult.status
      );
      if (!retryAuthError) {
        result = retryResult;
        authError = null;
      }
    }

    if (authError) {
      return jsonResponse(200, {
        ok: false,
        status: result.status,
        finalUrl: result.finalUrl,
        message: authError,
      });
    }

    if (result.status < 200 || result.status >= 300) {
      return jsonResponse(200, {
        ok: false,
        status: result.status,
        finalUrl: result.finalUrl,
        message: `O Google retornou HTTP ${result.status}. Verifique se a implantação do Apps Script está publicada para "Qualquer pessoa".`,
      });
    }

    return jsonResponse(200, {
      ok: true,
      status: result.status,
      finalUrl: result.finalUrl,
      text: result.text,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno ao consultar o Google.';
    return jsonResponse(200, {
      ok: false,
      message: `Não foi possível conectar ao servidor do Google: ${msg}`,
    });
  }
}
