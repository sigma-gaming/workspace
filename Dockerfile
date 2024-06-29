FROM node:20-alpine AS base
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
RUN apk update
RUN apk add nginx
COPY ./scripts/inject-env.mjs /scripts/inject-env.mjs
CMD node /scripts/inject-env.mjs; nginx -g "daemon off;"

FROM app-base AS games-app
WORKDIR /app
COPY --from=build /build/apps/games-app/dist ./
COPY --from=build /build/apps/games-app/nginx.conf /etc/nginx/nginx.conf

FROM app-base AS control-app
WORKDIR /app
COPY --from=build /build/apps/control-app/dist ./
COPY --from=build /build/apps/control-app/nginx.conf /etc/nginx/nginx.conf

FROM app-base AS maintenance-app
WORKDIR /app
COPY --from=build /build/apps/maintenance-app/dist ./
COPY --from=build /build/apps/maintenance-app/nginx.conf /etc/nginx/nginx.conf

# APIs

FROM base AS games-api
WORKDIR /workspace
COPY --from=build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/games-api/dist/main.js" ]

FROM base AS control-api
WORKDIR /workspace
COPY --from=build /build ./
CMD [ "node", "--max_semi_space_size=64", "apps/control-api/dist/main.js" ]
