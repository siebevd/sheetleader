# Build stage only - static files will be served by Caddy
FROM oven/bun:1 AS build
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN bun run build

# The dist folder will be copied by docker-compose volume mount
