/**
 * Cloudflare Worker entrypoint for "Астросовье".
 * - Protects organizer code retrieval behind admin password authentication.
 * - Verifies 30-second rotating 6-digit attendance codes.
 * - Serves static assets from ./public.
 */

const CODE_PERIOD_SECONDS = 30;
const CODE_SECRET = 'astrosovye-campus-secret-2026';
const DEFAULT_ADMIN_PASSWORD = 'astro-admin-2026';

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generateTotpCode(windowIndex) {
  const data = new TextEncoder().encode(`${CODE_SECRET}:${windowIndex}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(num % 1000000).padStart(6, '0');
}

async function createAdminToken(password) {
  return sha256Hex(`${CODE_SECRET}:admin-session:${password}`);
}

async function isAuthorizedAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7).trim();
  const expectedPassword = env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const expectedToken = await createAdminToken(expectedPassword);
  return token.length > 0 && token === expectedToken;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return jsonResponse({ ok: true, service: 'astrosovye' });
    }

    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ ok: false, error: 'Некорректный формат запроса' }, 400);
      }
      const password = String(body?.password || '');
      const expected = env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
      if (password !== expected) {
        return jsonResponse({ ok: false, error: 'Неверный пароль администратора' }, 401);
      }
      const token = await createAdminToken(expected);
      return jsonResponse({ ok: true, token });
    }

    if (url.pathname === '/api/admin/code' && request.method === 'GET') {
      const allowed = await isAuthorizedAdmin(request, env);
      if (!allowed) {
        return jsonResponse({ error: 'Требуется авторизация администратора' }, 401);
      }
      const nowSec = Math.floor(Date.now() / 1000);
      const windowIndex = Math.floor(nowSec / CODE_PERIOD_SECONDS);
      const secondsRemaining = CODE_PERIOD_SECONDS - (nowSec % CODE_PERIOD_SECONDS);
      const code = await generateTotpCode(windowIndex);
      return jsonResponse({
        code,
        periodSeconds: CODE_PERIOD_SECONDS,
        secondsRemaining,
        windowIndex
      });
    }

    if (url.pathname === '/api/code/verify' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ valid: false, error: 'Некорректный формат запроса' }, 400);
      }
      const submitted = String(body?.code || '').trim();
      if (!/^\d{6}$/.test(submitted)) {
        return jsonResponse({ valid: false, error: 'Код должен состоять из 6 цифр' }, 400);
      }
      const nowSec = Math.floor(Date.now() / 1000);
      const currentWindow = Math.floor(nowSec / CODE_PERIOD_SECONDS);
      const [currCode, prevCode] = await Promise.all([
        generateTotpCode(currentWindow),
        generateTotpCode(currentWindow - 1)
      ]);
      const valid = submitted === currCode || submitted === prevCode;
      return jsonResponse({ valid });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
