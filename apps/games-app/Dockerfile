FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV production
ENV NX_DAEMON false

COPY package.json yarn.lock .yarnrc.yml yarn.config.cjs ./
COPY .yarn/releases ./.yarn/releases
COPY apps ./apps
COPY libs ./libs
COPY games-libs ./games-libs
COPY tooling ./tooling

RUN yarn install --immutable
COPY . ./

RUN yarn nx run @apps/games-app:build
COPY . ./

COPY ./apps/games-app/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json

CMD ["yarn", "nx", "run", "@apps/games-app:start"]
