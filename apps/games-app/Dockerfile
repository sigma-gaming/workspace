FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV production

COPY . ./
RUN yarn install --immutable
COPY . ./
RUN yarn nx run @apps/games-app:build
COPY . ./

COPY ./apps/games-app/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json

CMD ["yarn", "nx", "run", "@apps/games-app:start"]
