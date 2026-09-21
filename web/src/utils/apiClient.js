/**
 * SmartDine API Client
 * Multi-host resilient helper for Netlify, Vercel, Vite, and Mobile environments.
 */

function resolveUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // If running in Capacitor native webview without http origin, or standard browser
  if (typeof window !== 'undefined') {
    const origin = window.location?.origin;
    if (origin && !origin.startsWith('null') && !origin.startsWith('file:')) {
      return path; // Browser handles relative paths natively
    }
  }
  return path;
}

export async function safeApiFetch(endpointPath, options = {}) {
  const cleanPath = endpointPath.replace(/^\/+/, '');
  const method = (options.method || 'GET').toUpperCase();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const body = options.body;

  // Candidate URLs in priority order:
  // 1. Standard /api/...
  // 2. Direct Netlify Functions /.netlify/functions/...
  const candidates = [
    resolveUrl(`/${cleanPath}`),
    resolveUrl(`/.netlify/functions/${cleanPath.replace(/^api\//, '')}`)
  ];

  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body
      });

      // If status is 404 or 405, try next candidate
      if (res.status === 404 || res.status === 405) {
        continue;
      }

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Returned HTML (e.g. static index.html fallback)
        continue;
      }

      return { res, ok: res.ok, status: res.status, data };
    } catch (err) {
      lastError = err;
    }
  }

  return { ok: false, status: 0, data: { error: lastError?.message || 'Network error' } };
}

/**
 * Robust Email OTP Dispatcher with multi-endpoint fallback and GET fallback
 */
export async function dispatchEmailOtp({ email, name = 'Customer', purpose = 'registration' }) {
  const cleanEmail = (email || '').trim();
  const cleanName = (name || 'Customer').trim();
  const payload = { email: cleanEmail, name: cleanName, purpose };
  const jsonBody = JSON.stringify(payload);

  const queryParams = `email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(cleanName)}&purpose=${encodeURIComponent(purpose)}`;

  const attempts = [
    // 1. Primary: POST /api/send-email-otp
    { url: resolveUrl('/api/send-email-otp'), method: 'POST', body: jsonBody, headers: { 'Content-Type': 'application/json' } },
    // 2. Direct Netlify Functions: POST /.netlify/functions/send-email-otp
    { url: resolveUrl('/.netlify/functions/send-email-otp'), method: 'POST', body: jsonBody, headers: { 'Content-Type': 'application/json' } },
    // 3. Fallback GET /api/send-email-otp (bypasses 405 Method Not Allowed on CDNs)
    { url: resolveUrl(`/api/send-email-otp?${queryParams}`), method: 'GET' },
    // 4. Fallback GET /.netlify/functions/send-email-otp
    { url: resolveUrl(`/.netlify/functions/send-email-otp?${queryParams}`), method: 'GET' }
  ];

  let lastErrorMsg = '';
  for (const att of attempts) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const res = await fetch(att.url, {
        method: att.method,
        headers: att.headers || {},
        body: att.body || undefined,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Skip 404 or 405 and try next attempt
      if (res.status === 404 || res.status === 405) {
        continue;
      }

      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        // Non-JSON response (e.g. index.html SPA redirect) -> try next attempt
        continue;
      }

      if (res.ok && data.success) {
        return {
          success: true,
          otp: String(data.otp),
          message: data.message || `Verification OTP sent to ${cleanEmail}.`
        };
      }

      // If server returned an explicit error (like duplicate user or validation error), throw it immediately
      if (data.error) {
        const err = new Error(data.error);
        if (data.error.includes('pehle se registered') || data.error.includes('already registered')) {
          err.isDuplicate = true;
        }
        throw err;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.isDuplicate || err.message?.includes('pehle se registered') || err.message?.includes('already registered')) {
        throw err;
      }
      lastErrorMsg = err.name === 'AbortError' ? 'Network timeout while contacting email server' : err.message;
    }
  }

  throw new Error(lastErrorMsg || 'Email delivery service is currently busy. Please try again.');
}
