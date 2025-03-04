FROM imbios/bun-node:1.2.3-22.14-slim AS base
WORKDIR /workspace
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update
RUN apt-get install -y ca-certificates

FROM base AS dependencies
WORKDIR /build
COPY .npmrc ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY ./patches ./patches
RUN pnpm fetch

FROM dependencies AS prebuild
COPY package.json ./package.json
COPY ./tooling ./tooling
COPY ./core ./core
COPY ./games-libs ./games-libs
COPY ./apps ./apps
COPY ./testing ./testing
RUN pnpm install --offline

ENV NX_DAEMON=true
COPY nx.json ./nx.json
COPY tsconfig.base.json ./tsconfig.base.json
COPY orval.config.ts ./orval.config.ts
COPY orval.download.ts ./orval.download.ts
COPY orval.sources.ts ./orval.sources.ts
COPY orval.watch.ts ./orval.watch.ts
COPY ./openapi ./openapi
COPY ./ssl ./ssl
RUN pnpm openapi:generate

# Apps

FROM node:22.14-alpine AS app-base
WORKDIR /app
ENV NODE_ENV=production
RUN apk update
RUN apk add nginx
COPY ./scripts/inject-env.mjs /scripts/inject-env.mjs
CMD node /scripts/inject-env.mjs; nginx -g "daemon off;"

FROM prebuild AS games-app-build
ARG sentry_auth_token
ARG sentry_release
ENV SENTRY_ORG=sigma-games
ENV SENTRY_PROJECT=games-app
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
RUN pnpm nx run @apps/games-app:build && \
  pnpm sentry-cli releases new -p games-app ${sentry_release} && \
  pnpm sentry-cli sourcemaps inject /build/apps/games-app/dist && \
  pnpm sentry-cli sourcemaps upload /build/apps/games-app/dist --release ${sentry_release}

FROM prebuild AS control-app-build
RUN pnpm nx run @apps/control-app:build

FROM prebuild AS maintenance-app-build
RUN pnpm nx run @apps/maintenance-app:build

FROM app-base AS games-app
WORKDIR /app
COPY --from=games-app-build /build/apps/games-app/nginx.conf /etc/nginx/nginx.conf
COPY --from=games-app-build /build/apps/games-app/dist ./
RUN chmod -R 755 /app

FROM app-base AS control-app
WORKDIR /app
COPY --from=control-app-build /build/apps/control-app/nginx.conf /etc/nginx/nginx.conf
COPY --from=control-app-build /build/apps/control-app/dist ./
RUN chmod -R 755 /app

FROM app-base AS maintenance-app
WORKDIR /app
COPY --from=maintenance-app-build /build/apps/maintenance-app/nginx.conf /etc/nginx/nginx.conf
COPY --from=maintenance-app-build /build/apps/maintenance-app/dist ./
RUN chmod -R 755 /app

# APIs

FROM base AS api-base
ENV NODE_ENV=production

FROM prebuild AS letsauth-build
RUN pnpm nx run @apis/letsauth:build

FROM api-base AS letsauth
COPY --from=letsauth-build /build ./
ENV HOST=0.0.0.0
# PORT is set from outside
CMD [ "node", "--max_semi_space_size=64", "apps/letsauth/dist/server/entry.mjs" ]

# Bot base

FROM node:22.14-slim AS bot-base
ENV NODE_ENV=production

# Bots

FROM prebuild AS games-bot-build
RUN pnpm nx run @bots/games-bot:build

FROM bot-base AS games-bot
COPY --from=games-bot-build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/games-bot/dist/main.js" ]

# GCR Cleaner

FROM base AS gcloud-sdk-base
RUN apt-get update
RUN apt-get install -y curl python3
RUN curl -sSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=/root
ENV PATH $PATH:/root/google-cloud-sdk/bin

FROM gcloud-sdk-base AS gcr-cleaner
WORKDIR /workspace
COPY --from=prebuild /build ./
CMD ["node", "apps/gcr-cleaner/script.mjs"]