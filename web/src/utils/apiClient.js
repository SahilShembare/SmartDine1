/**
 * SmartDine API Client
 * Multi-host resilient helper for Netlify, Vercel, Vite, Local Network, and Mobile environments.
 */

const PROD_API_ORIGIN = 'https://smartdine12.netlify.app';

function resolveUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (typeof window !== 'undefined') {
    const origin = window.location?.origin;
    if (origin && !origin.startsWith('null') && !origin.startsWith('file:') && !origin.startsWith('capacitor:')) {
      return path; // Standard web browser handles relative paths natively
    }
  }
  // Mobile/Capacitor/WebView without standard web origin
  return `${PROD_API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

function getCandidateUrls(endpointPath, queryParams = '') {
  const clean = endpointPath.replace(/^\/+/, '');
  const functionName = clean.replace(/^(api|\.netlify\/functions)\//, '');
  const query = queryParams ? `?${queryParams.replace(/^\?/, '')}` : '';

  const urls = [];

  // 1. Current origin relative /api/
  urls.push(resolveUrl(`/api/${functionName}${query}`));

  // 2. Current origin relative /.netlify/functions/
  urls.push(resolveUrl(`/.netlify/functions/${functionName}${query}`));

  // 3. Guaranteed Production Netlify API (fallback for mobile, preview, or disconnected dev servers)
  if (typeof window !== 'undefined') {
    const origin = window.location?.origin || '';
    if (!origin.includes('smartdine12.netlify.app')) {
      urls.push(`${PROD_API_ORIGIN}/api/${functionName}${query}`);
      urls.push(`${PROD_API_ORIGIN}/.netlify/functions/${functionName}${query}`);
    }
  }

  // Deduplicate URLs while preserving order
  return [...new Set(urls.filter(Boolean))];
}

export async function safeApiFetch(endpointPath, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const body = options.body;

  const candidates = getCandidateUrls(endpointPath);

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
        // Returned HTML (e.g. static index.html SPA fallback)
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
 * Robust Email OTP Dispatcher with multi-endpoint fallback, GET fallback, and production Netlify fallback
 */
export async function dispatchEmailOtp({ email, name = 'Customer', purpose = 'registration' }) {
  const cleanEmail = (email || '').trim();
  const cleanName = (name || 'Customer').trim();
  const payload = { email: cleanEmail, name: cleanName, purpose };
  const jsonBody = JSON.stringify(payload);
  const queryParams = `email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(cleanName)}&purpose=${encodeURIComponent(purpose)}`;

  const candidateBaseUrls = getCandidateUrls('send-email-otp');
  const attempts = [];

  for (const base of candidateBaseUrls) {
    // 1. POST JSON attempt
    attempts.push({
      url: base,
      method: 'POST',
      body: jsonBody,
      headers: { 'Content-Type': 'application/json' }
    });

    // 2. GET fallback attempt (bypasses CDN POST blocks)
    const getUrl = base.includes('?') ? `${base}&${queryParams}` : `${base}?${queryParams}`;
    attempts.push({
      url: getUrl,
      method: 'GET'
    });
  }

  let lastErrorMsg = '';

  for (const att of attempts) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for resilient email delivery

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
        lastErrorMsg = `Endpoint returned ${res.status}`;
        continue;
      }

      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        // Non-JSON response (e.g. index.html SPA redirect) -> try next candidate
        lastErrorMsg = 'Server returned HTML instead of API response';
        continue;
      }

      if (res.ok && data.success) {
        return {
          success: true,
          otp: String(data.otp),
          message: data.message || `Verification OTP sent to ${cleanEmail}.`
        };
      }

      // Check server returned error message (handles standard { error } and Netlify { errorMessage })
      const serverErr = data.error || data.errorMessage;
      if (serverErr) {
        const err = new Error(serverErr);
        if (serverErr.includes('pehle se registered') || serverErr.includes('already registered')) {
          err.isDuplicate = true;
          throw err;
        }
        // If client-side validation error (400), don't retry alternative endpoints
        if (res.status === 400) {
          throw err;
        }
        lastErrorMsg = serverErr;
      } else if (!res.ok) {
        lastErrorMsg = `Server error (${res.status})`;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.isDuplicate || err.message?.includes('pehle se registered') || err.message?.includes('already registered')) {
        throw err;
      }
      if (err.name === 'AbortError') {
        lastErrorMsg = 'Network connection timed out while sending OTP. Please check your internet connection.';
      } else if (err.message) {
        lastErrorMsg = err.message;
      }
    }
  }

  throw new Error(lastErrorMsg || 'Unable to deliver verification code. Please check your internet connection and try again.');
}
