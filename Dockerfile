FROM node:20-alpine AS base
WORKDIR /workspace
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS dependencies
WORKDIR /build
COPY package.json /build/package.json
COPY pnpm-lock.yaml /build/pnpm-lock.yaml
COPY pnpm-workspace.yaml /build/pnpm-workspace.yaml
COPY ./node_modules /build/node_modules
COPY .npmrc /build/.npmrc

FROM dependencies AS build
COPY ./tooling /build/tooling
COPY ./core /build/core
COPY ./dbs /build/dbs
COPY ./games-libs /build/games-libs
COPY ./apps /build/apps
COPY ./tsconfig.base.json /build/tsconfig.base.json
ENV NODE_ENV=production

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
RUN chmod -R 755 /app

FROM app-base AS control-app
WORKDIR /app
COPY --from=build /build/apps/control-app/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /build/apps/control-app/dist ./
RUN chmod -R 755 /app

FROM app-base AS maintenance-app
WORKDIR /app
COPY --from=build /build/apps/maintenance-app/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /build/apps/maintenance-app/dist ./
RUN chmod -R 755 /app

# API Base

FROM base AS api-base
ENV NODE_ENV=production
RUN apk add --no-cache gcompat

# APIs

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

FROM build AS games-tasks-build
ARG sentry_auth_token
ARG sentry_release
ENV SENTRY_ORG=sigma-games
ENV SENTRY_PROJECT=games-tasks
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
RUN pnpm sentry-cli releases new -p games-tasks ${sentry_release}
RUN pnpm sentry-cli releases set-commits --auto ${sentry_release}
RUN pnpm sentry-cli sourcemaps inject /build/apps/games-tasks/dist
RUN pnpm sentry-cli sourcemaps upload /build/apps/games-tasks/dist --release ${sentry_release}

FROM api-base AS games-api
COPY --from=games-api-build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/games-api/dist/main.js" ]

FROM api-base AS games-tasks
COPY --from=games-tasks-build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/games-tasks/dist/main.js" ]

FROM api-base AS control-api
COPY --from=build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/control-api/dist/main.js" ]

FROM api-base AS referral-redirect-api
COPY --from=build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/referral-redirect-api/dist/main.js" ]

FROM api-base AS access-api
COPY --from=build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/access-api/dist/main.js" ]

FROM api-base AS letsauth
COPY --from=build /build ./
ENV HOST=0.0.0.0
ENV PORT=4321
CMD [ "node", "--max_semi_space_size=64", "apps/letsauth/dist/server/entry.mjs" ]

# WS APIs

FROM build AS games-ws-build
ARG sentry_auth_token
ARG sentry_release
ENV SENTRY_ORG=sigma-games
ENV SENTRY_PROJECT=games-ws
ENV SENTRY_AUTH_TOKEN=${sentry_auth_token}
RUN pnpm sentry-cli releases new -p games-ws ${sentry_release}
RUN pnpm sentry-cli releases set-commits --auto ${sentry_release}
RUN pnpm sentry-cli sourcemaps inject /build/apps/games-ws/dist
RUN pnpm sentry-cli sourcemaps upload /build/apps/games-ws/dist --release ${sentry_release}

FROM api-base AS games-ws
WORKDIR /workspace
COPY --from=games-ws-build /build ./
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