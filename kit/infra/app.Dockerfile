FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY . .
CMD ["sh", "-c", "node db/seed.js && node src/server.js"]
