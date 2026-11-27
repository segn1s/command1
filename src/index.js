/**
 * Cloudflare Worker entrypoint for the Gamified Student Profile ("Твой мир больших достижений").
 * Provides lightweight API endpoints (30-second rotating 6-digit verification codes,
 * Schedion student data lookup, and health check) and serves static assets from ./public.
 */

const CODE_PERIOD_SECONDS = 30;
const CODE_SECRET = 'owl-campus-secret-2026';

/**
 * Generates a deterministic 6-digit code for a given 30-second time window.
 * @param {number} windowIndex
 * @returns {Promise<string>}
 */
async function generateTotpCode(windowIndex) {
  const data = new TextEncoder().encode(`${CODE_SECRET}:${windowIndex}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(num % 1000000).padStart(6, '0');
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

const MOCK_SCHEDION_STUDENTS = {
  '123': { id: '123', fullName: 'Иванов Иван Иванович', group: 'ИВТ-21', faculty: 'ФКТИ' },
  '204': { id: '204', fullName: 'Смирнова Анна Сергеевна', group: 'ПИ-31', faculty: 'ФКТИ' },
  '315': { id: '315', fullName: 'Козлов Дмитрий Алексеевич', group: 'БТ-12', faculty: 'ФЭА' },
  '408': { id: '408', fullName: 'Петрова Мария Викторовна', group: 'АД-22', faculty: 'ГФ' }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return jsonResponse({ ok: true, service: 'command1-student-city' });
    }

    if (url.pathname === '/api/code/current' && request.method === 'GET') {
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
        return jsonResponse({ valid: false, error: 'Некорректный JSON' }, 400);
      }
      const submitted = String(body?.code || '').trim();
      if (!/^\d{6}$/.test(submitted)) {
        return jsonResponse({ valid: false, error: 'Код должен состоять из 6 цифр' }, 400);
      }
      const nowSec = Math.floor(Date.now() / 1000);
      const currentWindow = Math.floor(nowSec / CODE_PERIOD_SECONDS);
      // Accept current window and previous window (grace period for 30s boundary)
      const [currCode, prevCode] = await Promise.all([
        generateTotpCode(currentWindow),
        generateTotpCode(currentWindow - 1)
      ]);
      const valid = submitted === currCode || submitted === prevCode;
      return jsonResponse({ valid });
    }

    if (url.pathname === '/api/schedion/lookup' && request.method === 'GET') {
      const id = String(url.searchParams.get('id') || '').trim();
      const record = MOCK_SCHEDION_STUDENTS[id];
      if (!record) {
        return jsonResponse({ found: false, message: 'Студент с таким ID не найден в Schedion' }, 404);
      }
      return jsonResponse({ found: true, student: record });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
