FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV production
STOPSIGNAL SIGTERM

COPY . ./
RUN yarn install --immutable
COPY . ./
RUN yarn nx run @apps/games-api:build
COPY . ./

COPY ./apps/games-api/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json

CMD ["yarn", "nx", "run", "@apps/games-api:start"]
