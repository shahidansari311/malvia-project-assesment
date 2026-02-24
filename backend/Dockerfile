FROM node:20-alpine

# Create non-root user for security
RUN addgroup -S malvia && adduser -S malvia -G malvia

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

# Change ownership
RUN chown -R malvia:malvia /app

USER malvia

EXPOSE 5000

# Use node directly (not npm) for better signal handling
CMD ["node", "src/index.js"]
