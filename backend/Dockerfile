# Image de developpement pour le backend AdonisJS.
# Pas de multi-stage build ici : en dev, le code vit dans un volume monte
# depuis l'hote (voir docker-compose.yml), ce Dockerfile ne sert qu'a
# obtenir un environnement Node avec les dependances deja installees.
FROM node:22-alpine

WORKDIR /app

# Copier uniquement les manifests d'abord pour profiter du cache Docker :
# tant que package.json ne change pas, "npm install" n'est pas rejoue.
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3333

# --hmr : recharge les fichiers modifies sans redemarrer tout le process.
CMD ["node", "ace", "serve", "--hmr"]
