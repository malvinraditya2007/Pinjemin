FROM node:20-slim

# OpenSSL is required by Prisma's query engine at runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Call the Prisma binary directly instead of `npx prisma` to avoid the
# "prisma: Permission denied" (exit 127) error seen on some build hosts.
RUN node node_modules/prisma/build/index.js generate

EXPOSE 3000

CMD ["npm", "start"]
