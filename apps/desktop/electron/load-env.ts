/**
 * Load repo-root `.env` before electron-store / API client read process.env.
 * Without this, the main process never sees AUTH_SECRET / VITE_DEFAULT_API_URL from `.env`,
 * so requests go out with no Bearer token → 401 on POST /v1/explanations.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

const candidates = [
  path.join(__dirname, '../../../.env'),
  path.join(__dirname, '../../.env'),
];

for (const envPath of candidates) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}
