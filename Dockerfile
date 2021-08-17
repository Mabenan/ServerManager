FROM node:lts

WORKDIR /app

RUN npm config set unsafe-perm true
RUN npm install -g typescript
RUN npm install -g pm2

COPY package*.json ./

COPY ./build ./

RUN npm install

EXPOSE 13371
ENV CONFIG_LOCATION="/config.json"
CMD [ "pm2-runtime", "start", "index.js" ]

