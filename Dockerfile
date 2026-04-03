
FROM node:20-slim


RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app


COPY package*.json ./


RUN npm install

COPY . .


EXPOSE 19000 19001 19002 8081

CMD ["npx", "expo", "start", "--dev-client"]