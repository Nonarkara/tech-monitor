# Stage 1: Build the frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app

# Copy only what's needed for production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

COPY server/ ./server/
COPY --from=builder /app/dist ./dist/

EXPOSE 4000

ENV NODE_ENV=production
ENV RENDER=true

CMD ["node", "server/index.mjs"]
