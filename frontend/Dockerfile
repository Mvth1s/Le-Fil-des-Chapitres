# Image de developpement pour le frontend Nuxt.
# Comme pour le backend, le code source est monte en volume depuis l'hote ;
# ce Dockerfile fige seulement l'environnement Node et les dependances.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

# --host 0.0.0.0 : sans cette option, le serveur Nuxt n'ecoute que sur
# localhost *dans le conteneur*, ce qui le rend injoignable depuis l'hote
# malgre le mapping de port dans docker-compose.yml.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
