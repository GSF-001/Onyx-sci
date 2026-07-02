FROM node:20-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy workspace files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY .npmrc ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./

# Copy workspace packages
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build API Server
RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm","--filter","@workspace/api-server","start"]
