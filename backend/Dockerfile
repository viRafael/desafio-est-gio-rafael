FROM node:24.8.0-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# ---------------- BUILD ----------------

FROM base AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile
COPY . .

RUN pnpm prisma generate && pnpm build

# ---------------- PRODUCTION ----------------

FROM base AS production

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

CMD ["pnpm", "start:prod"]