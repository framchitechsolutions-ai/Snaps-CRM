FROM node:18-alpine

WORKDIR /app

COPY frontend/package*.json /app/
RUN npm ci

COPY frontend /app

EXPOSE 3000

CMD ["npm", "run", "dev"]