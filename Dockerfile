FROM node:18-bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init

WORKDIR /usr/src/app
COPY . /usr/src/app

# @TODO: rewrite to multi stage or turbo
# ENV NODE_ENV production
# RUN yarn install --production
RUN yarn install
ENV NODE_ENV production
RUN yarn build

CMD ["dumb-init", "node", "./dist"]
