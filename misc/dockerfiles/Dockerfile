FROM ubuntu:18.04
MAINTAINER mth

RUN apt-get update && apt-get install -y software-properties-common && add-apt-repository ppa:deadsnakes/ppa \
		&& apt-get update \
		&& apt-get install -y gcc libpython3.6-dev libopenblas-dev libopenblas-base \
        python3.6 python3.6-dev libgeos-dev \
        libfreetype6-dev libfreetype6 libproj-dev libspatialindex-dev libv8-3.14-dev libffi-dev \
        nodejs nodejs-dev npm redis-server libuv1-dev unzip wget git \
        libxslt1-dev libxml2 libxml2-dev libkml-dev locales \
    && npm -g install topojson \
    && rm -rf /var/lib/apt/lists/* \
    && sed -e '/save/ s/^#*/#/' -i /etc/redis/redis.conf \
    && locale-gen fr_FR.UTF-8

ENV LANG='fr_FR.UTF-8' LANGUAGE='fr_FR' LC_ALL='fr_FR.UTF-8'

WORKDIR /home

ENV GDALINST /home/gdalinstall
ENV GDALBUILD /home/gdalbuild
ENV GDALOPTS="  --with-geos \
		        --with-expat \
		        --without-libtool \
		        --without-gif \
		        --without-pg \
		        --without-grass \
		        --without-libgrass \
		        --without-cfitsio \
		        --without-pcraster \
		        --without-netcdf \
		        --without-gif \
		        --without-ogdi \
		        --without-fme \
		        --without-hdf4 \
		        --with-spatialite \
		        --with-static-proj4=/usr/lib"

RUN mkdir $GDALBUILD && mkdir $GDALINST && cd $GDALBUILD && wget http://download.osgeo.org/gdal/2.2.3/gdal-2.2.3.tar.gz \
    && tar -xzf gdal-2.2.3.tar.gz && cd gdal-2.2.3 && ./configure --prefix=$GDALINST/gdal-2.2.3 $GDALOPTS \
	&& make -s -j 2 && make install

ENV PATH="${GDALINST}/gdal-2.2.3/bin:${PATH}"
ENV LD_LIBRARY_PATH="${GDALINST}/gdal-2.2.3/lib:${LD_LIBRARY_PATH}"

ARG CACHEBUST=1

RUN rm -rf $GDALBUILD && mkdir /home/app && cd /home/app && wget https://github.com/riatelab/magrit/archive/master.zip && unzip master.zip && mv magrit-master magrit

RUN wget https://bootstrap.pypa.io/get-pip.py && python3.6 get-pip.py

RUN cd /home/app/magrit/ \
    && pip3.6 install -U setuptools numpy \
    && pip3.6 install https://github.com/mthh/smoomapy-magrit/archive/master.zip \
    && pip3.6 install -U -r requirements/prod.txt \
    && python3.6 setup.py build_ext --inplace

EXPOSE 9999

CMD redis-server \
    & gunicorn "magrit_app.app:create_app()" --bind 0.0.0.0:9999 --worker-class aiohttp.worker.GunicornUVLoopWebWorker --workers 1 --chdir /home/app/magrit/
