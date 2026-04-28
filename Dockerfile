FROM oven/bun:1.1-alpine AS runtime
WORKDIR /app

COPY server/package.json ./server/
RUN cd server && bun install --production --no-save || true

COPY server ./server
COPY public ./public

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["bun", "run", "server/index.ts"]
