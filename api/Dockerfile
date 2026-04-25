FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN corepack enable && pnpm install
COPY . .
RUN pnpm prisma:generate && pnpm build
EXPOSE 4000
CMD ["pnpm", "start"]
