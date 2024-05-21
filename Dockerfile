FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /build
COPY . /build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm nx run-many -t build

# Apps

FROM base AS games-app
WORKDIR /app
COPY --from=build /build ./
COPY apps/games-app/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json
CMD [ "node", "--max_semi_space_size=64", "apps/games-app/server.js" ]

FROM base AS control-app
WORKDIR /app
COPY --from=build /build ./
COPY apps/control-app/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json
CMD [ "node", "--max_semi_space_size=64", "apps/control-app/server.js" ]

FROM base AS maintenance-app
WORKDIR /app
COPY --from=build /build ./
COPY apps/maintenance-app/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json
CMD [ "node", "--max_semi_space_size=64", "apps/maintenance-app/server.js" ]

# APIs

FROM base AS games-api
WORKDIR /app
COPY --from=build /build ./
COPY apis/games-api/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json
CMD [ "node", "--max_semi_space_size=64", "apis/games-api/dist/main.js" ]

FROM base AS control-api
WORKDIR /app
COPY --from=build /build ./
COPY apis/control-api/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json
CMD [ "node", "--max_semi_space_size=64", "apis/control-api/dist/main.js" ]
