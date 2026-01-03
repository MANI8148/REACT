# Containerized OSLabX Ecosystem
# This setup allows for isolated execution of user simulations

# Use a node base for the ecosystem orchestration
FROM node:20-alpine AS base

# Install build tools for C++ (needed for WASM compilation steps or local sandbox)
RUN apk add --no-cache build-base emscripten python3

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies (selective)
RUN npm i -g ts-node
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build step (example)
# RUN cd backend && npm run build
# RUN cd frontend && npm run build

EXPOSE 3000 3001

CMD ["sh", "-c", "cd backend && npm run dev & cd frontend && npm run dev"]
