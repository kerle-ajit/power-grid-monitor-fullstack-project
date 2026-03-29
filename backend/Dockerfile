FROM node:18-slim

RUN apt-get update && apt-get install -y openssl libssl-dev libc6 wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["node", "dist/server.js"]
