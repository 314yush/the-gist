import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { PUBLIC_SITE_URL } from './site.js';
import { health } from './routes/health.js';
import { auth } from './routes/auth.js';
import { explanations } from './routes/explanations.js';
import { profile } from './routes/profile.js';

const isProduction = process.env.NODE_ENV === 'production';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Env-configured origins (comma-separated)
      const envOrigins = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
      const allowed = [
        ...envOrigins,
        PUBLIC_SITE_URL,
        // Allow localhost only in non-production
        ...(!isProduction ? ['http://localhost:5173', 'http://localhost:5174'] : []),
      ];
      if (allowed.includes(origin)) return origin;
      // Allow the specific extension ID if configured, otherwise any extension in dev
      const extensionId = process.env.EXTENSION_ID;
      if (extensionId && origin === `chrome-extension://${extensionId}`) return origin;
      if (!extensionId && origin.startsWith('chrome-extension://')) return origin;
      return null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// Root-level health check for Railway/Render healthcheck probes
app.get('/health', (c) => c.json({ status: 'ok' }));

// All API routes under /v1
const v1 = new Hono();
v1.route('/health', health);
v1.route('/auth', auth);
v1.route('/explanations', explanations);
v1.route('/profile', profile);
app.route('/v1', v1);

app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'not_found',
        message: 'Endpoint not found',
        userMessage: 'The requested endpoint does not exist.',
      },
    },
    404
  );
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: {
        code: 'server_error',
        // Never leak internal error details in production
        message: isProduction ? 'Internal server error' : err.message,
        userMessage: 'Something went wrong on our end. Please try again.',
      },
    },
    500
  );
});

export default app;
