FROM node:20-slim AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/landing ./apps/landing

RUN corepack enable && pnpm install --frozen-lockfile --filter @thegist/landing
RUN pnpm -F @thegist/landing build

# --- Serve static files ---
FROM node:20-slim
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/apps/landing/dist ./dist

EXPOSE 3000
CMD ["serve", "dist", "-s", "-l", "3000"]
