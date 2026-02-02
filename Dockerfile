# syntax=docker.io/docker/dockerfile:1

# 1. Base image
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# 2. Install dependencies
FROM base AS deps
WORKDIR /usr/src/app
# Install OS dependencies required for node-gyp, etc.
RUN apk add --no-cache libc6-compat python3 make g++
# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 3. Build the application
FROM base AS builder
WORKDIR /usr/src/app
RUN rm -rf node_modules
COPY --from=deps /usr/src/app/node_modules ./node_modules

# ----- after COPY --from=deps -------------------------------------
# 1.  install the library’s own dev-dependencies and build
RUN cd node_modules/@veridid/workflow-parser && \
    yarn install --production=false && \
    yarn build
# 2.  prove the files are now there
RUN ls -l node_modules/@veridid/workflow-parser/dist
# ------------------------------------------------------------------

COPY . .
# Build based on the preferred package manager

# ----------  DEBUG : inspect what really arrived  -----------------
RUN echo "=== builder node_modules contents ===" && \
    ls -la node_modules/ | head -20 && \
    echo "=== @veridid dir exists? ============" && \
    ls -la node_modules/@veridid 2>/dev/null || echo "@veridid NOT FOUND" && \
    echo "=== workflow-parser package.json ===" && \
    cat node_modules/@veridid/workflow-parser/package.json 2>/dev/null || echo "package.json missing" && \
    echo "=== workflow-parser dist folder" && \
    ls -la node_modules/@veridid/workflow-parser 2>/dev/null || echo "workflow-parser dist not found" && \
    echo "=== real yarn.lock hash =============" && \
    sha256sum yarn.lock && \
    echo "=== forcing failure to keep layer ===" && \
    exit 1
# ------------------------------------------------------------------

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 4. Production image
FROM base AS runner
WORKDIR /usr/src/app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy production dependencies and lock file
COPY --from=deps /usr/src/app/package.json /usr/src/app/yarn.lock* /usr/src/app/package-lock.json* /usr/src/app/pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn install --production --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci --only=production; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --prod --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Copy compiled application code
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/dist ./dist

# Set user
USER nodejs

# Expose the port the app runs on
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Start the NestJS app
CMD ["node", "dist/main"]