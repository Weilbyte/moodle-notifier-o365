FROM node:12.18.0-alpine3.9

COPY ./ /srv/

WORKDIR /srv/

RUN yarn install && yarn cache clean

CMD yarn start