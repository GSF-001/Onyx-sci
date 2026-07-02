FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
COPY tsconfig.json ./
COPY tsconfig.base.json ./

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
