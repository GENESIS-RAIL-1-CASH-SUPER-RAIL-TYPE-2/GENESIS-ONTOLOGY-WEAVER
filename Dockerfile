FROM node:20.20.0-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY dist/ ./dist/
EXPOSE 8849
CMD ["node", "dist/index.js"]
