FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

FROM base AS dev
COPY . .
ENV HOST=0.0.0.0
ENV PORT=3001
ENV BROWSER=none
EXPOSE 3000
CMD ["npm", "start"]

FROM base AS builder
ARG REACT_APP_API_URL
ARG REACT_APP_FRONTEND_URL
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_VERSION
ARG REACT_APP_USE_MOCK_LOCATION=false
ARG FRONTEND_NODE_OPTIONS=--max-old-space-size=1536
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_FRONTEND_URL=$REACT_APP_FRONTEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_VERSION=$REACT_APP_VERSION
ENV REACT_APP_USE_MOCK_LOCATION=$REACT_APP_USE_MOCK_LOCATION
COPY . .
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_OPTIONS=$FRONTEND_NODE_OPTIONS
RUN npx react-scripts build

FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
