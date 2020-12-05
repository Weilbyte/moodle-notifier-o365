FROM buildkite/puppeteer:latest

COPY ./ /srv/

WORKDIR /srv/

RUN yarn install && yarn cache clean

CMD yarn start