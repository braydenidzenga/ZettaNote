FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (production only)
RUN pnpm install --prod && pnpm store prune

# Copy application code
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV MOTIA_PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the Motia service
CMD ["pnpm", "start"]
