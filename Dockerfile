FROM imbios/bun-node:1.1.20-20-alpine AS base
WORKDIR /workspace
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /build
COPY . /build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NODE_ENV=production
RUN pnpm nx run-many -t build

# Apps

FROM base AS app-base
WORKDIR /app
ENV NODE_ENV=production
RUN apk update
RUN apk add nginx
COPY ./scripts/inject-env.mjs /scripts/inject-env.mjs
CMD node /scripts/inject-env.mjs; nginx -g "daemon off;"

FROM build AS games-app-build
WORKDIR /build
ARG sentry_auth_token
ARG sentry_release
ENV SENTRY_ORG=sigma-games
ENV SENTRY_PROJECT=games-app
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
RUN pnpm sentry-cli releases new -p games-app ${sentry_release}
RUN pnpm sentry-cli releases set-commits --auto ${sentry_release}
RUN pnpm sentry-cli sourcemaps inject /build/apps/games-app/dist
RUN pnpm sentry-cli sourcemaps upload /build/apps/games-app/dist --release ${sentry_release}

FROM app-base AS games-app
WORKDIR /app
COPY --from=games-app-build /build/apps/games-app/nginx.conf /etc/nginx/nginx.conf
COPY --from=games-app-build /build/apps/games-app/dist ./

FROM app-base AS control-app
WORKDIR /app
COPY --from=build /build/apps/control-app/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /build/apps/control-app/dist ./

FROM app-base AS maintenance-app
WORKDIR /app
COPY --from=build /build/apps/maintenance-app/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /build/apps/maintenance-app/dist ./

# APIs

FROM oven/bun:1.1.20-alpine AS api-base
WORKDIR /workspace
ENV NODE_ENV=production

FROM build AS games-api-build
ARG sentry_auth_token
ARG sentry_release
ENV SENTRY_ORG=sigma-games
ENV SENTRY_PROJECT=games-api
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
RUN pnpm sentry-cli releases new -p games-api ${sentry_release}
RUN pnpm sentry-cli releases set-commits --auto ${sentry_release}
RUN pnpm sentry-cli sourcemaps inject /build/apps/games-api/dist
RUN pnpm sentry-cli sourcemaps upload /build/apps/games-api/dist --release ${sentry_release}

FROM api-base AS games-api
COPY --from=games-api-build /build ./
CMD [ "bun", "run", "apps/games-api/dist/main.js" ]

FROM api-base AS control-api
COPY --from=build /build ./
CMD [ "bun", "run", "apps/control-api/dist/main.js" ]

# WS APIs

FROM node:20-alpine AS ws-base
ENV NODE_ENV=production
RUN apk add --no-cache gcompat

FROM ws-base AS games-ws
WORKDIR /workspace
COPY --from=build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/games-ws/dist/main.js" ]

# Migrations

FROM base AS games-db-migration
WORKDIR /workspace
COPY --from=build /build ./
CMD [ "node", "apps/games-db-migration/dist/main.js" ]

# GCR Cleaner

FROM base AS gcloud-sdk-base
RUN apk add --update curl bash which python3
RUN curl -sSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=/root
ENV PATH $PATH:/root/google-cloud-sdk/bin

FROM gcloud-sdk-base AS gcr-cleaner
WORKDIR /workspace
COPY --from=build /build ./
CMD ["node", "apps/gcr-cleaner/script.mjs"]