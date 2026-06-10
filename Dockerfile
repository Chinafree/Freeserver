FROM node:18-alpine AS builder
WORKDIR /source-code
COPY . .

RUN apk add --no-cache \
  g++ \
  make \
  python3 \
  py3-pip \
  && ln -sf python3 /usr/bin/python \
  && (apk add --no-cache chromaprint || true)

RUN npm install --ignore-scripts --no-audit --no-fund

RUN npm run build

RUN rm -rf node_modules && npm install --omit=dev --no-audit --no-fund

RUN mkdir build-output \
  && mv server node_modules config.js index.js package.json public -t build-output


FROM node:18-alpine AS final
WORKDIR /server

RUN apk add --no-cache \
  ca-certificates \
  && (apk add --no-cache chromaprint || echo "chromaprint apk not found, will use bundled binary")

COPY --from=builder ./source-code/build-output ./

VOLUME /server/data
ENV DATA_PATH='/server/data'
ENV LOG_PATH='/server/data/logs'

EXPOSE 9527
ENV NODE_ENV='production'
ENV PORT=9527
ENV BIND_IP='0.0.0.0'

CMD [ "node", "index.js" ]