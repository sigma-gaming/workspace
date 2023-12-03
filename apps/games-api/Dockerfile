FROM node:20-alpine

WORKDIR /app

COPY node_modules ./node_modules
COPY dist/apps/games-api ./dist

ENV NODE_ENV production

CMD ["node", "dist/main.js"]
