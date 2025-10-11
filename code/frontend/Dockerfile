FROM node:22-alpine

WORKDIR /app

# copy package files to install deps
COPY package*.json ./
RUN npm ci --silent

# copy source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
