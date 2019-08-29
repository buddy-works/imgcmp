FROM node:10
WORKDIR /imgcmp
COPY package*.json /imgcmp/
RUN npm i --production
COPY . /imgcmp/
RUN ln -s /imgcmp/bin/imgcmp.js /usr/local/bin/imgcmp && chmod +x /usr/local/bin/imgcmp
CMD imgcmp