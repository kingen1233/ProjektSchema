FROM node:12-alpine
WORKDIR /app

COPY package*.json /app/

RUN NODE_ENV=production npm ci

COPY index.js /app/
COPY src src
COPY views views
COPY public public
COPY db db

EXPOSE 3000
CMD [ "npm", "start" ]
