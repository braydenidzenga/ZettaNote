# Multi-stage build for production
# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies and clear cache
RUN pnpm install --frozen-lockfile && \
    pnpm store prune

# Copy necessary source code
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

# Build argument for API URL
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN pnpm run build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Serve the app on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
