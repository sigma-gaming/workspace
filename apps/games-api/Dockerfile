FROM node:20-alpine

WORKDIR /app

# relative to root
COPY node_modules ./node_modules
COPY dist ./dist

ENV NODE_ENV production

CMD ["node", "dist/main.js"]
