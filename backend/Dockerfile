FROM node:20-alpine

WORKDIR /app

# Copy prisma schema + migrations
COPY prisma/ ./prisma/

# Install dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy backend source
COPY backend/ ./

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node server.js"]
