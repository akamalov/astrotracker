# Frontend Dockerfile for Astro application
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Expose the port that Astro runs on
EXPOSE 4321

# Start the development server
CMD ["pnpm", "dev", "--host", "0.0.0.0"] 