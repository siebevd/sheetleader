FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 3000

# Run the startup script (runs migrations then starts app)
CMD ["./start.sh"]
