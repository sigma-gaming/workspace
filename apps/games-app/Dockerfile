FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV production

COPY . ./
RUN yarn install --immutable
COPY . ./
RUN yarn nx run @apps/games-app:build
COPY . ./

CMD ["yarn", "nx", "run", "@apps/games-app:start"]
