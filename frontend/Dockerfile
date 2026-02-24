FROM node:20-alpine as build

WORKDIR /app

# Accept build-time env vars (Vite bakes them into the bundle)
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config for SPA (React Router support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
