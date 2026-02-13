FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY ../prisma ./prisma/
RUN npm install --production
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY . .

EXPOSE 4000

CMD ["npm", "start"]
