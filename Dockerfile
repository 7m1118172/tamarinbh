FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json to the container
COPY package.json ./

# Install dependencies (only express in this case)
RUN npm install --only=production

# Copy the rest of the application files
COPY . .

# Expose the correct port
EXPOSE 3000

# Start the node server
CMD ["npm", "start"]
