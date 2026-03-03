# === BASE IMAGE ===
# Use official Node.js image with version 18
# Alpine version is smaller but Node 18 slim/full are more compatible
FROM node:18-alpine

# === METADATA ===
# Label the image with description
LABEL description="Backend API for MindWise AI - Mental Health Support Application"

# === WORKING DIRECTORY ===
# Set working directory inside container where code will run
WORKDIR /app

# === INSTALL DEPENDENCIES ===
# Copy package.json and package-lock.json to install exact versions
COPY package*.json ./

# Install production dependencies
# npm install will create package-lock.json if it doesn't exist
RUN npm install --omit=dev

# === COPY APPLICATION CODE ===
# Copy entire backend source code into container
COPY . .

# === ENVIRONMENT ===
# Set Node environment to production for optimizations
ENV NODE_ENV=production

# === PORT ===
# Expose port 5000 where Express server listens
# This doesn't actually publish the port, just documents it
EXPOSE 5000

# === HEALTH CHECK ===
# Docker can automatically restart unhealthy containers
# Checks if server is running by pinging health endpoint (you can add this)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# === RUN APPLICATION ===
# Start the server when container starts
# Use "node src/server.js" for production (instead of npm dev)
CMD ["node", "src/server.js"]