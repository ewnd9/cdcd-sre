FROM node:18-bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init

WORKDIR /usr/src/app
COPY package.json yarn.lock /usr/src/app
RUN yarn install

# @TODO: rewrite to multi stage or turbo
# ENV NODE_ENV production
# RUN yarn install --production
COPY . /usr/src/app
ENV NODE_ENV production
RUN yarn build

CMD ["dumb-init", "node", "./dist"]
