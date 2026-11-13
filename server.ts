import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_PROXY_HOSTS = new Set([
  'script.google.com',
  'script.googleusercontent.com',
  'docs.google.com',
  'accounts.google.com',
]);

function isAllowedGoogleUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && ALLOWED_PROXY_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Normalizes Google Workspace Apps Script URLs:
 *   https://script.google.com/a/macros/comunidadecancaonova.com/s/AKfycb.../exec
 *   https://script.google.com/macros/u/1/s/AKfycb.../exec
 * into the universal public endpoint:
 *   https://script.google.com/macros/s/AKfycb.../exec
 */
function normalizeAppsScriptUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.trim());
    if (u.hostname === 'script.google.com') {
      // /a/macros/<domain>/s/<id>/exec -> /macros/s/<id>/exec
      u.pathname = u.pathname.replace(/^\/a\/macros\/[^/]+\/s\//i, '/macros/s/');
      // /macros/u/<num>/s/<id>/exec -> /macros/s/<id>/exec
      u.pathname = u.pathname.replace(/^\/macros\/u\/\d+\/s\//i, '/macros/s/');
    }
    return u.toString();
  } catch {
    return rawUrl.trim();
  }
}

function extractHtmlSummary(html: string): string {
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

function detectGoogleAuthOrPermissionHtml(bodyText: string, finalUrl: string, status: number): string | null {
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
      return `O Google retornou "Não foi possível abrir o arquivo" (HTTP ${status}). Causas comuns: (1) "Executar como" não está como "Eu"; (2) "Quem pode acessar" não está como "Qualquer pessoa"; (3) A organização Workspace bloqueia Web Apps públicos (tente publicar ou usar um link CSV em "3. Link CSV").`;
    }
    const summary = extractHtmlSummary(bodyText);
    return `O Google retornou HTML inesperado (HTTP ${status}${summary ? `: "${summary}"` : ''}). Confirme se a URL termina em /exec e se o acesso está como "Qualquer pessoa".`;
  }

  return null;
}

async function fetchWithGoogleRedirects(
  initialUrl: string,
  initialMethod: 'GET' | 'POST',
  payload?: unknown
): Promise<{ status: number; finalUrl: string; text: string }> {
  let currentUrl = initialUrl;
  let currentMethod: 'GET' | 'POST' = initialMethod;
  let currentBody: string | undefined =
    initialMethod === 'POST' ? JSON.stringify(payload ?? {}) : undefined;
  const cookies: string[] = [];

  for (let hop = 0; hop < 8; hop++) {
    if (!isAllowedGoogleUrl(currentUrl)) {
      throw new Error(`Redirecionamento para host não autorizado: ${currentUrl}`);
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
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
      // HTTP 301/302/303 after POST converts to GET on redirect (standard Google Apps Script /macros/echo flow)
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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

  // Server-side proxy for Google Apps Script & Google Sheets CSV (bypasses browser/iframe CORS issues)
  app.post('/api/sheets-proxy', async (req, res) => {
    try {
      const rawUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
      const method: 'GET' | 'POST' = req.body?.method === 'POST' ? 'POST' : 'GET';
      const payload = req.body?.payload;

      if (!rawUrl || !isAllowedGoogleUrl(rawUrl)) {
        res.status(400).json({
          ok: false,
          message: 'URL inválida. Apenas URLs HTTPS oficiais do Google Sheets ou Google Apps Script são permitidas.',
        });
        return;
      }

      const normalizedUrl = normalizeAppsScriptUrl(rawUrl);
      let result = await fetchWithGoogleRedirects(normalizedUrl, method, payload);
      let authError = detectGoogleAuthOrPermissionHtml(result.text, result.finalUrl, result.status);

      // If normalized /macros/s/ failed and original URL was different (e.g. /a/macros/domain/s/), try original too
      if (authError && normalizedUrl !== rawUrl) {
        const retryResult = await fetchWithGoogleRedirects(rawUrl, method, payload);
        const retryAuthError = detectGoogleAuthOrPermissionHtml(retryResult.text, retryResult.finalUrl, retryResult.status);
        if (!retryAuthError) {
          result = retryResult;
          authError = null;
        }
      }

      if (authError) {
        res.status(200).json({
          ok: false,
          status: result.status,
          finalUrl: result.finalUrl,
          message: authError,
        });
        return;
      }

      if (result.status < 200 || result.status >= 300) {
        res.status(200).json({
          ok: false,
          status: result.status,
          finalUrl: result.finalUrl,
          message: `O Google retornou HTTP ${result.status}. Verifique se a implantação do Apps Script está publicada para "Qualquer pessoa".`,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        status: result.status,
        finalUrl: result.finalUrl,
        text: result.text,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro interno ao consultar o Google.';
      res.status(200).json({
        ok: false,
        message: `Não foi possível conectar ao servidor do Google: ${msg}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
