FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
RUN mkdir -p /app/data
ENV PORT=8787
ENV HOOF_DATA_FILE=/app/data/players.json
EXPOSE 8787
CMD ["npm", "start"]
