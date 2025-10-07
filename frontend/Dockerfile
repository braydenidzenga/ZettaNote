# Production Dockerfile - serves pre-built React app with serve
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy pre-built files (built by GitHub Actions)
COPY build ./build

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Serve the app on port 80
CMD ["serve", "-s", "build", "-l", "80"]
