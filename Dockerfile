# syntax=docker.io/docker/dockerfile:1

# 1. Base image
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# 2. Install dependencies
FROM base AS deps
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
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
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

# Copy production dependencies
COPY --from=deps /usr/src/app/package*.json ./
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