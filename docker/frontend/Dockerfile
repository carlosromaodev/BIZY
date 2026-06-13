FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:3333
ARG VITE_N8N_URL=http://localhost:5678
ARG VITE_PUBLIC_MARKET_URL=
ARG VITE_PUBLIC_STORE_DOMAIN=
ARG VITE_TIKTOK_LIVE_USERNAME_PADRAO=@loja_teste
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_N8N_URL=$VITE_N8N_URL
ENV VITE_PUBLIC_MARKET_URL=$VITE_PUBLIC_MARKET_URL
ENV VITE_PUBLIC_STORE_DOMAIN=$VITE_PUBLIC_STORE_DOMAIN
ENV VITE_TIKTOK_LIVE_USERNAME_PADRAO=$VITE_TIKTOK_LIVE_USERNAME_PADRAO

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace frontend --include-workspace-root

COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
