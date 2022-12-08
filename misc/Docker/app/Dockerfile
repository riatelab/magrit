FROM ubuntu:22.04
MAINTAINER Matthieu Viry <matthieu.viry@cnrs.fr>

ENV DEBIAN_FRONTEND='noninteractive' TZ='Europe/Paris'

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        software-properties-common gcc g++ libpython3.11-dev python3.11 python3.11-dev python3-pip \
        libgeos-c1v5 libgeos-dev libgdal30 libgdal-dev libspatialindex-dev libffi-dev \
        nodejs npm libuv1 libuv1-dev unzip wget git \
        libxslt1.1 libxslt1-dev libxml2 libxml2-dev libkml-dev locales \
        libfftw3-3 libfftw3-dev autoconf automake libcjson1 libcjson-dev \
        build-essential pkg-config \
    && npm -g install topojson \
    && rm -rf /var/lib/apt/lists/* \
    && locale-gen fr_FR.UTF-8

ENV LANG='fr_FR.UTF-8' LANGUAGE='fr_FR' LC_ALL='fr_FR.UTF-8' NODE_ENV='PRODUCTION'

RUN cd /home \
    && git clone https://github.com/mthh/go_cart/ \
    && cd go_cart \
    && ./autogen.sh && ./configure && make && make install .

RUN mkdir /home/app && cd /home/app && mkdir magrit
COPY . /home/app/magrit

RUN cd /home/app/magrit/ \
    && python3.11 -m pip install --no-cache-dir -U setuptools numpy==1.23.4 \
    && python3.11 -m pip install --no-cache-dir -U -r requirements/prod.txt \
    && python3.11 setup.py build_ext --inplace \
    && cd client \
    && npm install \
    && node node_modules/webpack/bin/webpack.js \
    && cd ../documentation \
    && ./mdbook build

WORKDIR /home

EXPOSE 9999

CMD gunicorn "magrit_app.app:create_app(redis_addr='redis')" \
    --bind 0.0.0.0:9999 \
    --worker-class aiohttp.worker.GunicornUVLoopWebWorker \
    --max-requests 300 \
    --max-requests-jitter 75 \
    --workers 3 \
    --chdir /home/app/magrit/
