FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV production

COPY . ./
RUN yarn install --immutable
COPY . ./
RUN yarn nx run @apps/maintenance:build
COPY . ./

COPY ./apps/maintenance/metrics-endpoint.json /var/cadvisor/metrics-endpoint.json

CMD ["yarn", "nx", "run", "@apps/maintenance:start"]
