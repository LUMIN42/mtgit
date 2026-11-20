# Single container: the Express API serves both /trpc and the built frontend (see apps/api/src/index.ts).
# Independent of the Vercel (vercel.json) and Render (render.yaml, node runtime) deployments.

FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install dependencies first so they are cached until a package.json changes
COPY package.json ./
COPY apps/api/package.json apps/api/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN npm install --no-audit --no-fund

COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/frontend apps/frontend

# Same-origin API: the frontend calls /trpc on whatever host serves it
ARG VITE_API_URL=/trpc
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build && npm prune --omit=dev


FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/resources apps/api/resources
COPY --from=build /app/apps/frontend/dist apps/frontend/dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
