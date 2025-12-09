FROM node:18-alpine

WORKDIR /app

# Install PostgreSQL client and bash for scripts
RUN apk add --no-cache postgresql-client bash

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build
RUN npm run build

# Copy entrypoint script from parent directory (context is root in docker-compose)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

# Use entrypoint to run migrations before starting
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]

