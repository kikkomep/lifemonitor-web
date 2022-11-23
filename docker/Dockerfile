##############################################################
# "builder" stage: build webapp with npm and Angular-CLI
##############################################################
FROM node:15.4-alpine as builder

# Set the working dir
WORKDIR /app

# Copy dependency index
COPY package*.json ./

# Install dependencies
RUN npm install -g @angular/cli@13.3.10 && npm ci

# Copy sources from a clone of the repository @ https://github.com/crs4/LifeMonitorWeb
COPY  . .

# Build front-end for production deployments
RUN ng build --prod


##############################################################
# target stage: serve angular app through NGINX
##############################################################
FROM nginx:1.21.1

# comment user directive as master process is run as user in OpenShift anyhow
RUN sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf
# Copy the compiled angular app from the 'frontend-build' stage
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Copy NGINX site configuration
COPY --from=builder /app/dist/lifemonitor /app

# Fix permissions
RUN chmod g+rwx /var/cache/nginx /var/run /var/log/nginx

# Set the working dir
WORKDIR /app

# Expose service port
EXPOSE 4200
