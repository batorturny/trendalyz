# Base image
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
# --ignore-scripts skips postinstall (prisma generate) — schema not yet available
RUN npm install --legacy-peer-deps --ignore-scripts

# Build stage
FROM base AS builder
WORKDIR /app/frontend

COPY --from=deps /app/frontend/node_modules ./node_modules
COPY frontend/ ./
COPY prisma/ /app/prisma/

ENV NEXT_TELEMETRY_DISABLED=1

# Remove backendClient and frontendClient generators from schema.
# In Docker we only need the default generator; the other two point to
# monorepo-relative paths that don't exist inside the container.
RUN node -e "\
const fs = require('fs');\
let s = fs.readFileSync('/app/prisma/schema.prisma', 'utf8');\
s = s.replace(/\ngenerator backendClient \{[\s\S]*?\n\}/g, '');\
s = s.replace(/\ngenerator frontendClient \{[\s\S]*?\n\}/g, '');\
fs.writeFileSync('/app/prisma/schema.prisma', s);\
console.log('Stripped extra Prisma generators for Docker build.');\
"

# Generate Prisma client (default only) + build Next.js
# npm run build calls: prisma generate && next build
# prisma generate uses schema path from package.json: ../prisma/schema.prisma
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next || true
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
