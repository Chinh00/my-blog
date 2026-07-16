# Build: Astro static output (kèm index Pagefind)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve: nginx alpine, chỉ chứa dist/ tĩnh
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# 127.0.0.1 tường minh: busybox wget resolve localhost ra ::1 trước,
# trong khi nginx chỉ listen IPv4 → connection refused giả
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
