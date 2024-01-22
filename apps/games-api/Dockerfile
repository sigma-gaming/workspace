FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV production
ENV NX_DAEMON false

STOPSIGNAL SIGTERM

COPY package.json yarn.lock .yarnrc.yml yarn.config.cjs ./
COPY .yarn/releases ./.yarn/releases
COPY apps ./apps
COPY libs ./libs
RUN yarn install --immutable

COPY . ./
RUN yarn nx run @apps/games-api:build
COPY . ./

COPY ./apps/games-api/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json

CMD ["yarn", "nx", "run", "@apps/games-api:start:migrate"]
