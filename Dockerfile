# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for Supabase
ENV VITE_SUPABASE_URL=https://bdcqaeppqnwixhumfsso.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkY3FhZXBwcW53aXhodW1mc3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMTM0MTcsImV4cCI6MjA2Njc4OTQxN30.p0BSXUgjstOMOuli_Ko7Kf8Z-T7fb5ozp9qWr-tK_tc

# Set executable permissions for node_modules binaries
RUN chmod +x node_modules/.bin/*

# Build the application using npx to ensure proper execution
RUN npx vite build

# List contents of dist directory for debugging
RUN ls -la /app/dist/

# Production stage
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create a simple test file
RUN echo '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Nginx Test OK</h1></body></html>' > /usr/share/nginx/html/test.html

# List contents for debugging
RUN ls -la /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]