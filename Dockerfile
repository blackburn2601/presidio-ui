# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

# nginx:alpine substitutes ${VAR} in these templates at container start, so the
# Presidio endpoints stay configurable without rebuilding the image.
ENV PRESIDIO_ANALYZER_URL=http://192.168.178.89:5002 \
    PRESIDIO_ANONYMIZER_URL=http://192.168.178.89:5001

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
