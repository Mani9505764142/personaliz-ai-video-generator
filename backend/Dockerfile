FROM node:18-alpine

WORKDIR /app

# Install system dependencies (minimal)
RUN apk add --no-cache python3 make g++

# Copy and install dependencies first (for better caching)
COPY package*.json ./
RUN npm install --only=production

# Copy source files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3001

# Use node directly with TypeScript loader (fastest startup)
CMD ["node", "--loader", "ts-node/esm", "server.ts"]
