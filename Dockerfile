# Use a Node.js base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Build the TypeScript project
RUN npm run build

# Command to run the application
# It's important to pass arguments correctly to the npm script
# Note: The "max 3 bounties at a time" is not directly supported by the current script
# and would require code changes to `continuous-bounty-loop.ts`.
# This command will continuously create bounties one after another.
CMD ["npm", "run", "bounty:continuous", "--", "--chain", "degen", "--reward", "50"]