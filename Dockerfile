FROM node:16.0.0

ARG web=/opt/workspace/portkey-bingo-game

WORKDIR ${web}

COPY . ${web}

RUN yarn \
    && yarn build 

ENTRYPOINT yarn start

EXPOSE 3000