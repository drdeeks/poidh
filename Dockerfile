FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source and web
COPY src ./src
COPY web ./web

# Install dependencies and build
RUN npm ci && npm run build

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Environment defaults
ENV NODE_ENV=production
ENV STREAMING_PORT=3001
ENV LOG_LEVEL=info

# Start both services:
# 1. Continuous bounty loop in background
# 2. Streaming server in foreground
CMD ["sh", "-c", "npm run bounty:continuous > ./logs/bot.log 2>&1 & npm run server:stream"]
