# Usar una imagen de Node para construir y servir
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Construir el proyecto de React/Vite
RUN npm run build

# Instalar 'serve' globalmente en este contenedor
RUN npm install -g serve

# Exponer el puerto
EXPOSE 5000

# Iniciar 'serve' apuntando a la carpeta dist en modo Single Page Application (-s)
CMD ["serve", "-s", "dist", "-l", "5000"]