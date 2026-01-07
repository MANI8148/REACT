# React Projects Collection

This repository contains two primary projects focused on modern web development, API integration, and system simulations.

##  Project Structure

### 1. [Crypto Wallet](./crypto-wallet)
A production-ready cryptocurrency wallet application.
- **Frontend:** React with Vite, styled with modern CSS and glassmorphism.
- **Backend:** Node.js Express server.
- **Key Features:** Secure PIN management, real-time transaction history, rate limiting, and 2FA-ready authentication.

### 2. [OSLabX Suite](./oslabx-suite)
A comprehensive Operating Systems laboratory simulation ecosystem.
- **Frontend:** Next.js application for interactive visualizations.
- **Backend:** Node.js Express with Socket.io for real-time simulation logic.
- **Core:** C++ base implementations for OS algorithms (Scheduler, Memory, etc.).
- **Containerization:** Includes a `Dockerfile` for isolated environment execution.

---

##  Getting Started

### To run Crypto Wallet:
1. Navigate to `crypto-wallet/`
2. Follow the instructions in the project's internal README.

### To run OSLabX Suite:
1. Navigate to `oslabx-suite/`
2. Use the provided Docker configuration:
   ```bash
   docker build -t oslabx-suite .
   docker run -p 3000:3000 -p 3001:3001 oslabx-suite
   ```
3. Alternatively, run backend and frontend separately using `npm run dev` in their respective directories.
