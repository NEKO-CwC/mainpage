FROM node:24-alpine AS build
WORKDIR /app
COPY package.json index.html tokens.css styles.css site-config.js ./
COPY assets/main.js ./assets/main.js
COPY scripts/*.cjs ./scripts/
RUN npm run check && npm run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/ /srv/
