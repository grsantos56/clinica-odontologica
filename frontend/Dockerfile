# Estágio de Build
FROM node:20-alpine AS build 
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm cache clean --force

# CORREÇÃO CRÍTICA: Garante que os binários tenham permissão de execução
RUN chmod -R +x node_modules 

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Executa o build
RUN npx vite build

# Estágio de Execução (Nginx)
FROM nginx:alpine

# 1. Copia o build do React
COPY --from=build /app/dist /usr/share/nginx/html

# 2. Copia sua configuração personalizada do Nginx (que faz o proxy reverso)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]