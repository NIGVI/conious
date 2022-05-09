

# container for testing on linux
# and watchers tests
FROM node:16-alpine

COPY package* ./
RUN npm i
COPY . ./

CMD ["npm", "run", "test-file"]