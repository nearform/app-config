FROM nearform/alpine3-s2i-nodejs:10

# Create app directory
WORKDIR /opt/app-root/src

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001

CMD [ "npm", "run", "start" ]