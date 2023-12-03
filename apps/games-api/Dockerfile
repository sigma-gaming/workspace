FROM node:20-alpine

WORKDIR /app

COPY node_modules ./node_modules
COPY apps/games-api/dist ./dist

ENV NODE_ENV production

CMD ["node", "dist/main.js"]
