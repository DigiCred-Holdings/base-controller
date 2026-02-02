# syntax=docker.io/docker/dockerfile:1

# 1. Base image
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# 2. Install dependencies
FROM base AS deps
WORKDIR /usr/src/app
# Install OS dependencies required for node-gyp, etc.
RUN apk add --no-cache libc6-compat python3 make g++

# --- DEBUG: what yarn.lock did we get? -----------------------------
COPY package.json yarn.lock* ./
RUN echo "--- yarn.lock checksum inside deps stage ---" && \
    sha256sum yarn.lock && \
    echo "--- package 'my-pkg' present? ---" && \
    grep -E "veridid" yarn.lock || echo "veridid NOT found"
# -----------------------------------------------------------------

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
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# --- DEBUG: double-check after the full COPY ---------------------
RUN echo "--- final yarn.lock checksum ---" && \
    sha256sum yarn.lock && \
    echo "--- node_modules/my-pkg version ---" && \
    cat node_modules/@veridid/workflow-parser/package.json | jq -r .version || echo "my-pkg not in node_modules"
# -----------------------------------------------------------------

# Build based on the preferred package manager
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