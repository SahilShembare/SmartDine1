import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom plugin to serve /api/ routes inside Vite development server
function razorpayDevApiPlugin() {
  const getHandler = async (relativePath) => {
    const filePath = path.resolve(__dirname, relativePath);
    const fileUrl = pathToFileURL(filePath).href;
    const mod = await import(fileUrl);
    return mod.default || mod;
  };

  return {
    name: 'razorpay-dev-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next();
        }

        // Parse JSON body
        const parseBody = () => new Promise((resolve) => {
          let data = '';
          req.on('data', chunk => { data += chunk; });
          req.on('end', () => {
            try {
              resolve(data ? JSON.parse(data) : {});
            } catch {
              resolve(data);
            }
          });
        });

        const url = req.url.split('?')[0];

        // Express-compatible response helpers
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
          return res;
        };

        try {
          const body = await parseBody();
          req.body = body;

          if (url === '/api/create-razorpay-order') {
            const handler = await getHandler('./api/create-razorpay-order.js');
            return handler(req, res);
          } else if (url === '/api/verify-razorpay-payment') {
            const handler = await getHandler('./api/verify-razorpay-payment.js');
            return handler(req, res);
          } else if (url === '/api/razorpay-webhook') {
            const handler = await getHandler('./api/razorpay-webhook.js');
            return handler(req, res);
          } else if (url === '/api/refund-payment') {
            const handler = await getHandler('./api/refund-payment.js');
            return handler(req, res);
          } else {
            return next();
          }
        } catch (err) {
          console.error('API middleware error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        }
      });
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
