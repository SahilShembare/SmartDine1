import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom plugin to serve /api/ and /.netlify/functions/ routes inside Vite development and preview servers
function razorpayDevApiPlugin() {
  const getHandler = async (relativePath) => {
    const filePath = path.resolve(__dirname, relativePath);
    const fileUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
    const mod = await import(fileUrl);
    return mod.default || mod.handler || mod;
  };

  const setupMiddleware = (server) => {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || (!req.url.startsWith('/api/') && !req.url.startsWith('/.netlify/functions/'))) {
        return next();
      }

      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.end();
        return;
      }

      const host = req.headers.host || 'localhost:5173';
      const urlObj = new URL(req.url, `http://${host}`);
      let url = urlObj.pathname.replace(/\/+$/, '') || '/';
      // Normalize /.netlify/functions/xyz to /api/xyz
      if (url.startsWith('/.netlify/functions/')) {
        url = url.replace('/.netlify/functions/', '/api/');
      }

      const query = Object.fromEntries(urlObj.searchParams.entries());
      req.query = query;

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Parse JSON body safely for POST/PUT/PATCH requests
      const parseBody = () => new Promise((resolve) => {
        if (req.method === 'GET' || req.method === 'HEAD' || req.readableEnded) {
          return resolve({});
        }
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve(data ? { raw: data } : {});
          }
        });
        req.on('error', () => resolve({}));
      });

      // Express-compatible response helpers
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.send = (body) => {
        if (res.writableEnded) return res;
        if (typeof body === 'object') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        } else {
          res.end(String(body));
        }
        return res;
      };
      res.json = (obj) => {
        if (res.writableEnded) return res;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(obj));
        return res;
      };

      try {
        const body = await parseBody();
        req.body = body;

        let handlerPath = null;
        if (url === '/api/create-razorpay-order') handlerPath = './api/create-razorpay-order.js';
        else if (url === '/api/verify-razorpay-payment') handlerPath = './api/verify-razorpay-payment.js';
        else if (url === '/api/razorpay-webhook') handlerPath = './api/razorpay-webhook.js';
        else if (url === '/api/refund-payment') handlerPath = './api/refund-payment.js';
        else if (url === '/api/send-email-otp') handlerPath = './api/send-email-otp.js';
        else if (url === '/api/send-password-reset-link') handlerPath = './api/send-password-reset-link.js';
        else if (url === '/api/check-duplicate-user') handlerPath = './api/check-duplicate-user.js';
        else if (url === '/api/record-registered-user') handlerPath = './api/record-registered-user.js';
        else if (url === '/api/update-user-password') handlerPath = './api/update-user-password.js';
        else if (url === '/api/verify-user-credentials') handlerPath = './api/verify-user-credentials.js';

        if (!handlerPath) {
          return next();
        }

        const handler = await getHandler(handlerPath);
        await handler(req, res);
      } catch (err) {
        console.error('API middleware error:', err);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }));
        }
      }
    });
  };

  return {
    name: 'razorpay-dev-api-plugin',
    configureServer(server) {
      setupMiddleware(server);
    },
    configurePreviewServer(server) {
      setupMiddleware(server);
    }
  };
}

export default defineConfig(({ mode }) => {
  // Load env from current directory and parent directory
  const envDir = path.resolve(__dirname, '..');
  const envWeb = loadEnv(mode, __dirname, '');
  const envRoot = loadEnv(mode, envDir, '');

  // Populate process.env for Node API handlers
  Object.assign(process.env, envRoot, envWeb);

  return {
    plugins: [react(), razorpayDevApiPlugin()],
    server: {
      port: 5173,
      host: true
    }
  };
});
