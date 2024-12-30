FROM imbios/bun-node:1.1.42-20.18-slim AS base
WORKDIR /workspace
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update
RUN apt-get install ca-certificates

FROM base AS dependencies-base
WORKDIR /build
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY ./patches ./patches
RUN pnpm fetch

FROM dependencies-base AS dependencies-tree
COPY package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY ./tooling ./tooling
COPY ./core ./core
COPY ./dbs ./dbs
COPY ./games-libs ./games-libs
COPY ./apps ./apps
COPY ./testing ./testing

FROM dependencies-tree AS dependencies-dev
RUN pnpm install --offline

FROM dependencies-dev AS prebuild
ENV NX_DAEMON=true
COPY nx.json ./nx.json
COPY tsconfig.base.json ./tsconfig.base.json
COPY ./ssl ./ssl

# Apps

FROM node:20.18-alpine AS app-base
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

# API Base

FROM oven/bun:1.1.42-slim AS api-base-bun
ENV NODE_ENV=production
WORKDIR /workspace

FROM node:20.18-slim AS api-base-node
ENV NODE_ENV=production
WORKDIR /workspace

# APIs

FROM prebuild AS games-api-build
ARG sentry_auth_token
ARG sentry_release
ENV SENTRY_ORG=sigma-games
ENV SENTRY_PROJECT=games-api
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
RUN pnpm nx run @apis/games-api:build && \
  pnpm sentry-cli releases new -p games-api ${sentry_release} && \
  pnpm sentry-cli sourcemaps inject /build/apps/games-api/dist && \
  pnpm sentry-cli sourcemaps upload /build/apps/games-api/dist --release ${sentry_release}

FROM prebuild AS games-tasks-build
ARG sentry_auth_token
ARG sentry_release
ENV SENTRY_ORG=sigma-games
ENV SENTRY_PROJECT=games-tasks
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
RUN pnpm nx run @apis/games-tasks:build && \
  pnpm sentry-cli releases new -p games-tasks ${sentry_release} && \
  pnpm sentry-cli sourcemaps inject /build/apps/games-tasks/dist && \
  pnpm sentry-cli sourcemaps upload /build/apps/games-tasks/dist --release ${sentry_release}

FROM prebuild AS control-api-build
RUN pnpm nx run @apis/control-api:build

FROM prebuild AS referral-redirect-api-build
RUN pnpm nx run @apis/referral-redirect-api:build

FROM prebuild AS access-api-build
RUN pnpm nx run @apis/access-api:build

FROM prebuild AS payment-api-build
RUN pnpm nx run @apis/payment-api:build

FROM prebuild AS letsauth-build
RUN pnpm nx run @apis/letsauth:build

FROM api-base-bun AS games-api
COPY --from=games-api-build /build ./
CMD [ "bun", "run", "apps/games-api/dist/main.js" ]

FROM api-base-bun AS games-tasks
COPY --from=games-tasks-build /build ./
CMD [ "bun", "run", "apps/games-tasks/dist/main.js" ]

FROM api-base-bun AS control-api
COPY --from=control-api-build /build ./
CMD [ "bun", "run", "apps/control-api/dist/main.js" ]

FROM api-base-bun AS referral-redirect-api
COPY --from=referral-redirect-api-build /build ./
CMD [ "bun", "run", "apps/referral-redirect-api/dist/main.js" ]

FROM api-base-bun AS access-api
COPY --from=access-api-build /build ./
CMD [ "bun", "run", "apps/access-api/dist/main.js" ]

FROM api-base-bun AS payment-api
COPY --from=payment-api-build /build ./
CMD [ "bun", "run", "apps/payment-api/dist/main.js" ]

FROM api-base-node AS letsauth
COPY --from=letsauth-build /build ./
ENV HOST=0.0.0.0
# PORT is set from outside
CMD [ "node", "--max_semi_space_size=64", "apps/letsauth/dist/server/entry.mjs" ]

# WS APIs

FROM prebuild AS games-ws-build
ARG sentry_auth_token
ARG sentry_release
ENV SENTRY_ORG=sigma-games
ENV SENTRY_PROJECT=games-ws
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
RUN pnpm nx run @apis/games-ws:build && \
  pnpm sentry-cli releases new -p games-ws ${sentry_release} && \
  pnpm sentry-cli sourcemaps inject /build/apps/games-ws/dist && \
  pnpm sentry-cli sourcemaps upload /build/apps/games-ws/dist --release ${sentry_release}

FROM api-base-node AS games-ws
WORKDIR /workspace
COPY --from=games-ws-build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/games-ws/dist/main.js" ]

# Migrations

FROM prebuild AS games-db-migration-build
RUN pnpm nx run @migrations/games-db-migration:build

FROM base AS games-db-migration
WORKDIR /workspace
COPY --from=games-db-migration-build /build ./
CMD [ "bun", "run", "apps/games-db-migration/dist/main.js" ]

# GCR Cleaner

FROM base AS gcloud-sdk-base
# RUN apk add --update curl bash which python3
RUN curl -sSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=/root
ENV PATH $PATH:/root/google-cloud-sdk/bin

FROM gcloud-sdk-base AS gcr-cleaner
WORKDIR /workspace
COPY --from=prebuild /build ./
CMD ["node", "apps/gcr-cleaner/script.mjs"]