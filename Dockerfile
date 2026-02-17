# ========================================
# STEP 1 : Build
# ========================================
FROM node:20-alpine AS builder
LABEL authors="ziroles"
LABEL description="iHatePdf - Éditeur PDF sécurisé 100% local"

# Install build dependencies for native modules (if needed)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the SvelteKit application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# ========================================
# STEP 2 : Make production image
# ========================================
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Copy static files and other necessary files
COPY --from=builder --chown=nodejs:nodejs /app/static ./static

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    BODY_SIZE_LIMIT=52428800

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "build"]
