FROM node:latest

WORKDIR /app

COPY ./src/dashboard /app

RUN rm -rf node_modules/ && npm install

CMD [ "npm", "start" ]