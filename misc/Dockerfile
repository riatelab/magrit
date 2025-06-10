# All-in-one image to build and execute magrit in a single container.
# To build this image you need to be in "magrit" folder and not in "magrit/misc/" folder,
# then run:
#   docker build -t "magrit" -f misc/Dockerfile .
# Then you can run the container with:
#   docker run --publish "9999:9999" -it "magrit:latest"

# Base for amd64
FROM ubuntu:22.04 AS build_amd64
LABEL org.opencontainers.image.authors="Matthieu Viry <matthieu.viry@cnrs.fr>"
WORKDIR /home
ONBUILD RUN apt-get update \
    && apt-get install -y curl

# Base for arm64
FROM ubuntu:22.04 AS build_arm64
LABEL org.opencontainers.image.authors="Matthieu Viry <matthieu.viry@cnrs.fr>"
WORKDIR /home
ONBUILD RUN apt-get update \
    && apt-get install -y curl

# The actual container that reuse arm64/amd64 base
FROM build_${TARGETARCH}
LABEL org.opencontainers.image.authors="Matthieu Viry <matthieu.viry@cnrs.fr>"

ENV DEBIAN_FRONTEND='noninteractive' TZ='Europe/Paris'
WORKDIR /home

# Install dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends locales nginx \
    && curl -sL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh \
    && bash nodesource_setup.sh \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && locale-gen fr_FR.UTF-8

ENV LANG='fr_FR.UTF-8' LANGUAGE='fr_FR' LC_ALL='fr_FR.UTF-8'

RUN mkdir /home/app && cd /home/app && mkdir magrit
COPY . /home/app/magrit

# Build the app and the documentation in the `dist` folder,
# copy the dist folder to the nginx folder
# and copy the nginx configuration file
RUN cd /home/app/magrit \
    && npm ci --no-audit \
    && npm run build \
    && mkdir -p /var/www/magrit.app \
    && cp -r dist/* /var/www/magrit.app/ \
    && cp /home/app/magrit/misc/nginx.conf /etc/nginx/sites-available/default \
    && rm -rf /home/app/magrit \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

# Expose the port 9999
EXPOSE 9999

# Start the nginx server
CMD ["nginx", "-g", "daemon off;"]
