FROM node:20-bookworm

# Install system dependencies for Playwright/Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libx11-6 \
    libxext6 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --include=dev

# Copy project files
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Install Chromium browser for Playwright
RUN npx playwright install chromium

# The port your app listens on
EXPOSE 5000

# Start the server
CMD ["npm", "run", "start"]
