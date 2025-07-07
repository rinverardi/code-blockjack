FROM node:23

WORKDIR /home/node/backend
COPY backend/deployments/sepolia/ deployments/sepolia/
RUN chown -R node:node .

WORKDIR /home/node/frontend
COPY frontend/.env.example .env
COPY frontend/*.html ./
COPY frontend/*.json ./
COPY frontend/*.ts ./
COPY frontend/public/ public/
COPY frontend/src/ src/
RUN chown -R node:node .

USER node
RUN npm install
RUN npx vite build

CMD npx serve dist --no-clipboard
