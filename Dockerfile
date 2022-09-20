FROM node:12-alpine
WORKDIR /plugin
COPY package.json /plugin/
COPY yarn.lock /plugin/
RUN yarn install
COPY src /plugin/src
RUN npm run build
CMD ["node", "dist/index.js"]