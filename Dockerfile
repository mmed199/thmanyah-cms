# syntax=docker/dockerfile:1.6

FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# Install global utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy package metadata for runtime scripts (e.g., migration commands)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY nest-cli.json tsconfig.json tsconfig.build.json ./

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
