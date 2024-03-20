# All-in-one image to build and execute magrit in a single container.
# See the other recipes (with docker compose) if you want to use magrit with nginx.
# To build this image you need to be in "magrit" folder and not in "magrit/misc/dockerfiles" folder,
# then run:
#   docker build -t "magrit" -f misc/dockerfiles/Dockerfile .
# Then you can run the container with:
#   docker run --publish "9999:9999" -it "magrit:latest"

# Base for amd64
FROM ubuntu:22.04 as build_amd64
LABEL org.opencontainers.image.authors="Matthieu Viry <matthieu.viry@cnrs.fr>"
WORKDIR /home
ONBUILD RUN apt-get update \
    && apt-get install -y curl \
    && curl -sL https://github.com/rust-lang/mdBook/releases/download/v0.4.28/mdbook-v0.4.28-x86_64-unknown-linux-gnu.tar.gz -o mdbook.tar.gz \
    && tar xvzf mdbook.tar.gz

# Base for arm64
FROM ubuntu:22.04 as build_arm64
LABEL org.opencontainers.image.authors="Matthieu Viry <matthieu.viry@cnrs.fr>"
WORKDIR /home
ONBUILD RUN apt-get update \
    && apt-get install -y curl \
    && curl -sL https://github.com/rust-lang/mdBook/releases/download/v0.4.28/mdbook-v0.4.28-aarch64-unknown-linux-musl.tar.gz -o mdbook.tar.gz \
    && tar xvzf mdbook.tar.gz

# The actual container that reuse arm64/amd64 base
FROM build_${TARGETARCH}
LABEL org.opencontainers.image.authors="Matthieu Viry <matthieu.viry@cnrs.fr>"

ENV DEBIAN_FRONTEND='noninteractive' TZ='Europe/Paris'
WORKDIR /home

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        software-properties-common gcc g++ libpython3.11-dev python3.11 python3.11-dev python3-pip \
        libgeos-c1v5 libgeos-dev libgdal30 libgdal-dev libspatialindex-dev libffi-dev \
        redis-server libuv1 libuv1-dev unzip git \
        libxslt1.1 libxslt1-dev libxml2 libxml2-dev libkml-dev locales \
    && curl -sL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh \
    && bash nodesource_setup.sh \
    && apt-get install -y nodejs \
    && npm -g install topojson \
    && rm -rf /var/lib/apt/lists/* \
    && sed -e '/save/ s/^#*/#/' -i /etc/redis/redis.conf \
    && locale-gen fr_FR.UTF-8

ENV LANG='fr_FR.UTF-8' LANGUAGE='fr_FR' LC_ALL='fr_FR.UTF-8' NODE_ENV='PRODUCTION'

RUN mkdir /home/app && cd /home/app && mkdir magrit
COPY . /home/app/magrit

RUN cd /home/app/magrit/ \
    && python3.11 -m pip install --no-cache-dir -U setuptools numpy==1.23.4 wheel cython \
    && python3.11 -m pip install --no-cache-dir -U -r requirements/prod.txt \
    && python3.11 setup.py build_ext --inplace

RUN cd /home/app/magrit/client \
    && npm ci --no-audit --maxsockets 1 \
    && NODE_OPTIONS=--openssl-legacy-provider node node_modules/webpack/bin/webpack.js

RUN mv /home/mdbook /home/app/magrit/documentation/mdbook \
    && cd /home/app/magrit/documentation \
    && ./mdbook build

WORKDIR /home

EXPOSE 9999

CMD redis-server \
    & gunicorn "magrit_app.app:create_app()" \
    --bind 0.0.0.0:9999 \
    --worker-class aiohttp.worker.GunicornUVLoopWebWorker \
    --workers 1 \
    --chdir /home/app/magrit/
