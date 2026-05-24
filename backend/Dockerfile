FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create necessary directories
RUN mkdir -p logs src/uploads/profiles src/uploads/lab-reports

EXPOSE 5000

CMD ["node", "src/server.js"]
