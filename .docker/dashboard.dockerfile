FROM node:latest

WORKDIR /app

COPY . /app

RUN rm -rf node_modules/ && npm install

CMD [ "npm", "start" ]