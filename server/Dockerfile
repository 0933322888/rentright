FROM node:18

WORKDIR /app
COPY package*.json ./
RUN rm -rf node_modules package-lock.json && npm install
COPY . .

# AWS S3 ENV VARS (set these in your deployment environment)
ENV AWS_ACCESS_KEY_ID=your-access-key-id
ENV AWS_SECRET_ACCESS_KEY=your-secret-access-key
ENV AWS_REGION=ca-central-1
ENV AWS_S3_BUCKET=rentright-data