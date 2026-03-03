# === Build Stage ===
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build-time env vars (passed via docker-compose or --build-arg)
ARG VITE_API_URL
ARG VITE_ELEVENLABS_AGENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ELEVENLABS_AGENT_ID=$VITE_ELEVENLABS_AGENT_ID

RUN npm run build

# === Production Stage ===
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
