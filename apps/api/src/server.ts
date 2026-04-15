import './env.js';
import { serve } from '@hono/node-server';
import app from './index.js';

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 The Gist API running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
