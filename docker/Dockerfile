##############################################################
# "builder" stage: build webapp with npm and Angular-CLI
##############################################################
FROM node:22-alpine AS builder

RUN echo $(npm --version && node --version)

# Set the working dir
WORKDIR /app

# Copy dependency index
COPY package*.json ./

# Install dependencies
RUN npm update -g npm && npm install -g @angular/cli@20.3.13 && npm ci --force --legacy-peer-deps

# Copy sources from a clone of the repository @ https://github.com/crs4/LifeMonitorWeb
COPY  . .

# Build front-end for production deployments
RUN ng build --configuration production


##############################################################
# target stage: serve angular app through NGINX
##############################################################
FROM crs4/lifemonitor-web:base

# comment user directive as master process is run as user in OpenShift anyhow
# RUN sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf
# Copy the compiled angular app from the 'frontend-build' stage
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Copy NGINX site configuration
COPY --from=builder /app/dist/lifemonitor/browser /app

# Fix permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx \
    && chmod -R g+rwx /var/cache/nginx /var/run/ /var/log/nginx

# Set the working dir
WORKDIR /app

# Expose service port
EXPOSE 4200
