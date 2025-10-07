FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (production only)
RUN pnpm install --prod --frozen-lockfile

# Copy application code
COPY . .

# Environment variables (these will be overridden by Coolify)
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "app.js"]
