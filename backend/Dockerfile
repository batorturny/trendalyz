FROM node:20-alpine

WORKDIR /app

# Copy Prisma schema from monorepo root
COPY prisma/ ./prisma/

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --production

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy backend source
COPY backend/ ./

EXPOSE 4000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node server.js"]
