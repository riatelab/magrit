#!/usr/bin/env python3.6
# -*- coding: utf-8 -*-
"""
magrit

Usage:
  magrit
  magrit [--addr <address> --redis-addr <address> --port <port_nb> --dev --standalone]
  magrit [-p <port_nb> -a <address> -r <address> -d -s]
  magrit --standalone
  magrit --version
  magrit --help

Options:
  -h, --help                                Show this screen.
  --version                                 Show version.
  -p <port>, --port <port>                  Port number to use (exit if not available).[default: 9999]
  -a <address>, --addr <address>            The IP address to use to create the server. [default: 0.0.0.0]
  -r <address>, --redis-addr <address>      The IP address to use for connecting to redis (if different from the one used to create the server).
  -d, --dev                                 Watch for changes in js/css files and update the transpiled/minified versions.
  -s, --standalone                          Start the Magrit server application for a single use (without using Redis).
"""

import os
import re
import sys
import traceback
import ujson as json
import time
import docopt
import logging

import asyncio
try:
    import uvloop
except:
    uvloop = None
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')

from tempfile import TemporaryDirectory
from base64 import b64encode, urlsafe_b64decode
from contextlib import closing
from zipfile import ZipFile
from datetime import datetime
from io import StringIO, BytesIO
from os.path import join as path_join

from cryptography import fernet
from subprocess import Popen, PIPE
from socket import socket, AF_INET, SOCK_STREAM
from mmh3 import hash as mmh3_hash
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from concurrent.futures._base import CancelledError
from pyexcel import get_book
from ipaddress import ip_address
# Web related stuff :
# from aioredis import create_pool, create_redis_pool
from aiohttp import web, ClientSession
from aiohttp_session import (
    cookie_storage, get_session, session_middleware, redis_storage,
    setup as aiohttp_session_setup)
from multidict import MultiDict

try:
    from helpers.misc import (
        run_calc, savefile, get_key, zip_layer_folder,
        extractShpZip, guess_separator, clean_name, find_geo2topo)
    from helpers.cy_misc import get_name, join_field_topojson
    from helpers.topo_to_geo import convert_from_topo
    from helpers.geo import (
        reproj_convert_layer_kml, reproj_convert_layer, make_carto_doug,
        check_projection, olson_transform, get_proj4_string,
        make_geojson_links, TopologicalError, ogr_to_geojson, read_shp_crs)
    from helpers.stewart_smoomapy import quick_stewart_mod
    from helpers.grid_layer import get_grid_layer
    from helpers.grid_layer_pt import get_grid_layer_pt
    from helpers.error_middleware404 import error_middleware
except:
    from .helpers.misc import (
        run_calc, savefile, get_key, zip_layer_folder,
        extractShpZip, guess_separator, clean_name, find_geo2topo)
    from .helpers.cy_misc import get_name, join_field_topojson
    from .helpers.topo_to_geo import convert_from_topo
    from .helpers.geo import (
        reproj_convert_layer_kml, reproj_convert_layer, make_carto_doug,
        check_projection, olson_transform, get_proj4_string,
        make_geojson_links, TopologicalError, ogr_to_geojson, read_shp_crs)
    from .helpers.stewart_smoomapy import quick_stewart_mod
    from .helpers.grid_layer import get_grid_layer
    from .helpers.grid_layer_pt import get_grid_layer_pt
    from .helpers.error_middleware404 import error_middleware


GEO2TOPO_PATH = None
IS_WINDOWS = sys.platform.startswith('win')
IS_FROZEN = True if getattr(sys, 'frozen', False) else False


async def index_handler(request):
    """
    Handler for the index page.
    Index page visitors (new/already known) are also counted in this function.
    """
    asyncio.ensure_future(
        request.app['redis_conn'].incr('view_onepage'),
        loop=request.app.loop)
    session = await get_session(request)
    if 'already_seen' not in session:
        asyncio.ensure_future(
            request.app['redis_conn'].incr('single_view_onepage'),
            loop=request.app.loop)
    session['already_seen'] = True
    return web.FileResponse('./static/index.html')


async def serve_main_page(request):
    """
    Handler for the application real page.
    """
    session_redis = await get_session(request)
    get_user_id(session_redis, request.app['app_users'], request.app)
    return web.FileResponse('./static/modules.html')


async def serve_contact_form(request):
    """
    Handler for the contact page.
    """
    return web.FileResponse('./static/contact_form.html')


async def geojson_to_topojson(data, layer_name):
    """
    Convert the input GeoJSON layer (given as `bytes`) to
    a TopoJSON layer (using the name given in 'layer_name').

    Parameters
    ----------
    data: bytes
        GeoJSON FeatureCollection to be converted to TopoJSON.
    layer_name: str
        The name of the TopoJSON layer to be created.

    Returns
    -------
    result: str
        The resulting TopoJSON file, as string.
    """
    global GEO2TOPO_PATH
    process = Popen([GEO2TOPO_PATH, "{}=-".format(layer_name), "--bbox"],
                    stdout=PIPE, stderr=PIPE, stdin=PIPE, shell=IS_WINDOWS)
    stdout, _ = process.communicate(input=data)
    stdout = stdout.decode()
    return stdout


def topojson_to_geojson(data):
    """
    Topojson to geojson back-conversion in python
    (through cython-written extension)

    Parameters
    ----------
    data: dict
        TopoJSON data (loaded as a dict) to be converted to GeoJSON.

    Returns
    -------
    result: str
        The resulting GeoJSON FeatureCollection, dumped as a string.
    """
    return json.dumps(convert_from_topo(data))


async def remove_layer(request):
    """
    Removes layer(s) from the temporary storage (trigered either when
    the user removes result layer in the UI or when he leaves the application
    page).
    """
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis, request.app['app_users'])
    f_names = posted_data.getall('layer_name')
    for name in f_names:
        f_name = '_'.join([user_id, name])
        # request.app['logger'].debug("Deleting  " + name)
        asyncio.ensure_future(
            request.app["redis_conn"].delete(f_name))
    return web.Response(text=json.dumps({"code": "Ok"}))


async def get_sample_layer(request):
    """
    Returns the sample layer requested by the user
    (in the first panel of the left menu).
    """
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])

    user_id = get_user_id(session_redis, request.app['app_users'])
    name = posted_data.get('layer_name')
    path = request.app['db_layers'][name]
    hash_val = str(mmh3_hash(path))
    f_name = '_'.join([user_id, hash_val])

    asyncio.ensure_future(
        request.app['redis_conn'].incr('sample_layers'))

    result = await request.app['redis_conn'].get(f_name)
    if result:
        result = result.decode()
        asyncio.ensure_future(
            request.app['redis_conn'].pexpire(f_name, 43200000))
        return web.Response(text=''.join([
            '{"key":', hash_val,
            ',"file":', result.replace(''.join([user_id, '_']), ''), '}'
        ]))
    else:
        with open(path, 'r') as f:
            data = f.read()
        asyncio.ensure_future(
            request.app['redis_conn'].set(
                f_name, data, pexpire=43200000))
        return web.Response(text=''.join(
            ['{"key":', hash_val, ',"file":', data, '}']
        ))


def get_user_id(session_redis, app_users, app=None):
    """
    Function to get (or retrieve) the user unique ID
    (ID is used amongst other things to set/get data in/from redis
    and for retrieving the layers decribed in a "preference file" of an user)
    """
    if 'app_user' not in session_redis:
        if app:
            asyncio.ensure_future(
                app['redis_conn'].incr('single_view_modulepage'),
                loop=app.loop)
        user_id = get_key(app_users)
        app_users.add(user_id)
        session_redis['app_user'] = user_id
        return user_id
    else:
        user_id = session_redis['app_user']
        if user_id not in app_users:
            app_users.add(user_id)
        return user_id


def convert_error(message='Error converting input file'):
    return web.Response(text='{{"Error": "{}"}}'.format(message))


async def convert_topo(request):
    """
    Convert/sanitize a topojson layer uploaded by the user and
    store it (in topojson format) in redis during the user session
    for a possible later use.
    """
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])

    try:
        file_field = posted_data['file[]']
        name = file_field.filename
        data = file_field.file.read()

    except Exception as err:
        request.app['logger'].info(
            "Error while reading TopoJSON file\nPosted data :\n{}\nerr:\n{}"
            .format(posted_data, err))
        return convert_error("Incorrect datatype")

    user_id = get_user_id(session_redis, request.app['app_users'])
    hash_val = str(mmh3_hash(data))
    f_name = '_'.join([user_id, hash_val])

    asyncio.ensure_future(
        request.app['redis_conn'].incr('layers'))

    result = await request.app['redis_conn'].get(f_name)
    if result:
        result = result.decode()
        asyncio.ensure_future(
            request.app['redis_conn'].pexpire(f_name, 43200000))
        return web.Response(text=''.join([
            '{"key":', hash_val,
            ',"file":', result.replace(hash_val, name), '}'
        ]))

    asyncio.ensure_future(
        request.app['redis_conn'].set(f_name, data, pexpire=43200000))
    return web.Response(text=''.join(
        ['{"key":', hash_val, ',"file":null}']
    ))


async def convert(request):
    """
    Convert/sanitize a layer uploaded by the user and
    store it (in topojson format) in redis during the user session
    for a possible later use.
    """
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    if not 'type' in posted_data:
        return convert_error('Invalid request')
    type_input = posted_data.get('type')
    user_id = get_user_id(session_redis, request.app['app_users'])

    with TemporaryDirectory() as tmp_dir:
        if type_input == 'single':
            return await _convert_from_single_file(
                request.app, posted_data, user_id, tmp_dir)
        elif type_input == 'multiple':
            return await _convert_from_multiple_files(
                request.app, posted_data, user_id, tmp_dir)
        else:
            return convert_error('Invalid request')


async def _convert_from_multiple_files(app, posted_data, user_id, tmp_dir):
    proj_info_str = None
    try:
        list_files, tmp_buf = [], []
        for i in range(len(posted_data) - 1):
            field = posted_data.getall('file[{}]'.format(i))[0]
            name, ext = field.filename.rsplit('.', 1)
            file_name = path_join(
                tmp_dir,
                '{}_{}.{}'.format(user_id, clean_name(name), ext.lower())
            )
            list_files.append(file_name)
            content = field.file.read()
            savefile(file_name, content)
            if '.shp' in file_name or '.dbf' in file_name:
                tmp_buf.append(content)
        shp_path = [i for i in list_files if 'shp' in i][0]
        layer_name = shp_path.replace(
            path_join(tmp_dir, '{}_'.format(user_id)), '').replace('.shp', '')
        hashed_input = mmh3_hash(b''.join(tmp_buf))
        name = shp_path.rsplit(os.path.sep, 1)[1]
    except Exception as err:
        _tb = traceback.format_exc(limit=2)
        app['logger'].info(
            'Error while loading shapefile : {}\n{}\n{}'
            .format(err, _tb, list_files))
        return convert_error('Error while loading shapefile')

    f_name = '_'.join([user_id, str(hashed_input)])

    asyncio.ensure_future(
        app['redis_conn'].incr('layers'))

    result = await app['redis_conn'].get(f_name)
    if result:
        # We know this user and his layer has already been loaded into Redis,
        # so let's use it instead of doing a new conversion again:
        asyncio.ensure_future(
            app['redis_conn'].pexpire(f_name, 43200000))
        # Read the orignal projection to propose it later:
        proj_info_str = read_shp_crs(
            path_join(tmp_dir, name.replace('.shp', '.prj')))

        return web.Response(text=''.join(
            ['{"key":', str(hashed_input),
             ',"file":', result.decode(),
             ',"proj":', json.dumps(get_proj4_string(proj_info_str)),
             '}']))
    else:
        res = await app.loop.run_in_executor(
            app["ProcessPool"],
            ogr_to_geojson,
            shp_path)
        if not res:
            return convert_error()
        result = await geojson_to_topojson(res, layer_name)
        if not result:
            return convert_error()

        asyncio.ensure_future(
            app['redis_conn'].set(f_name, result, pexpire=43200000))

        # Read the orignal projection to propose it later (client side):
        proj_info_str = read_shp_crs(
            path_join(tmp_dir, name.replace('.shp', '.prj')))

        return web.Response(text=''.join(
            ['{"key":', str(hashed_input),
             ',"file":', result,
             ',"proj":', json.dumps(get_proj4_string(proj_info_str)),
             '}']))


async def _convert_from_single_file(app, posted_data, user_id, tmp_dir):
    proj_info_str = None
    try:
        field = posted_data.get('file[]')
        name = field.filename
        layer_name = name.rsplit('.', 1)[0]
        data = field.file.read()
        datatype = field.content_type
        hashed_input = mmh3_hash(data)
        filepath = path_join(tmp_dir, '{}_{}'.format(user_id, name))
    except Exception as err:
        _tb = traceback.format_exc(limit=2)
        app['logger'].info(
            'Error while loading single file : {}\n{}'.format(err, _tb))
        app['logger'].info(
            "Posted data :\n{}\nName:\n{}".format(posted_data, field.filename))
        return convert_error('Incorrect datatype')

    f_name = '_'.join([user_id, str(hashed_input)])

    asyncio.ensure_future(
        app['redis_conn'].incr('layers'))

    result = await app['redis_conn'].get(f_name)
    if result:
        # We know this user and his layer has already been loaded into Redis,
        # so let's use it instead of doing a new conversion again:
        asyncio.ensure_future(
            app['redis_conn'].pexpire(f_name, 43200000))

        return web.Response(text=''.join(
            ['{"key":', str(hashed_input),
             ',"file":', result.decode(),
             ',"proj":', json.dumps(get_proj4_string(proj_info_str)),
             '}']))

    if datatype in ('application/x-zip-compressed', 'application/zip'):
        dataZip = BytesIO(data)

        with ZipFile(dataZip) as myzip:
            list_files = myzip.namelist()
            # The required files ('cpg' is only used if present):
            slots = {"shp": None, "prj": None, "dbf": None, "shx": None}
            names = []
            try:
                assert(4 <= len(list_files) < 8)
                for f in list_files:
                    name, ext = f.rsplit('.', 1)
                    names.append(name)
                    if 'shp' in ext.lower():
                        slots['shp'] = f
                    elif 'prj' in ext.lower():
                        slots['prj'] = f
                    elif 'shx' in ext.lower():
                        slots['shx'] = f
                    elif 'dbf' in ext.lower():
                        slots['dbf'] = f
                    elif 'cpg' in ext.lower():
                        slots['cpg'] = f
                # All slots (excepting maybe 'cpg' one) are not None:
                assert(all(v is not None for v in slots.values()))
                # Each file has the same "base" name:
                assert(all(name == names[0] for name in names))
            except Exception as err:
                _tb = traceback.format_exc(limit=2)
                app['logger'].info(
                    'Error with content of zip file : {}'.format(_tb))
                return convert_error('Error with zip file content')

            # Extract the content of the zip file and replace any uppercase
            # extension by its lowercase version :
            slots = extractShpZip(myzip, slots, tmp_dir)
            try:
                res = await app.loop.run_in_executor(
                    app["ProcessPool"],
                    ogr_to_geojson,
                    slots['shp'])
                if not res:
                    return convert_error()
                result = await geojson_to_topojson(res, layer_name)
                if not result:
                    return convert_error()

                # Read the orignal projection to propose it later:
                proj_info_str = read_shp_crs(slots['prj'])

                asyncio.ensure_future(
                    app['redis_conn'].set(
                        f_name, result, pexpire=43200000))
            except (asyncio.CancelledError, CancelledError):
                return
            except Exception as err:
                _tb = traceback.format_exc(limit=2)
                app['logger'].info(
                    'Error with content of zip file : {}\n{}'.format(err, _tb))
                return convert_error('Error with zip file content')

    elif ('octet-stream' in datatype or 'text/json' in datatype
            or 'application/geo+json' in datatype
            or 'application/json' in datatype
            or 'text/plain' in datatype
            or 'application/vnd.google-earth.kml+xml' in datatype
            or 'application/gml+xml' in datatype) \
            and ("kml" in name.lower()
                 or "gml" in name.lower() or 'json' in name.lower()):
        fname, ext = filepath.rsplit('.', 1)
        # Sanitize the extension name in case it's badly written (will help for
        # the conversion to come)
        # (replaces .json by .geojson, .KML by .kml, .GeoJSON by .geojson, etc.)
        if 'json' in ext.lower():
            new_ext = 'geojson'
        elif 'gml' in ext.lower():
            new_ext = 'gml'
        elif 'kml' in ext.lower():
            new_ext = 'kml'
        filepath = ''.join([clean_name(fname), new_ext])
        tmp_path = path_join(tmp_dir, filepath)
        # Convert the file to a GeoJSON file with sanitized column names:
        with open(tmp_path, 'wb') as f:
            f.write(data)
        res = await app.loop.run_in_executor(
            app["ThreadPool"],
            ogr_to_geojson,
            tmp_path)

        if not res:
            return convert_error(
                'Error reading the input file ({} format)'.format(new_ext))

        # Convert the file to a TopoJSON:
        result = await geojson_to_topojson(res, layer_name)
        if not result:
            return convert_error('Error reading the input file')

        # Store it in redis for possible later use:
        asyncio.ensure_future(
            app['redis_conn'].set(
                f_name, result, pexpire=43200000))

    else:
        # Datatype was not detected; so nothing was done
        # (Shouldn't really occur as it has already been
        # checked client side before sending it):
        app['logger'].info("Incorrect datatype :\n{}name:\n{}"
                           .format(datatype, name))
        return convert_error('Incorrect datatype')

    return web.Response(text=''.join(
        ['{"key":', str(hashed_input),
         ',"file":', result,
         ',"proj":', json.dumps(get_proj4_string(proj_info_str)),
         '}']))


async def convert_extrabasemap(request):
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis, request.app['app_users'])

    url = posted_data['url']
    layer_name = posted_data['layer_name']
    async with ClientSession(loop=request.app.loop) as client:
        async with client.get(url) as resp:
            assert resp.status == 200
            data = await resp.text()
            data = data.encode()
            hashed_input = mmh3_hash(data)
            f_name = '_'.join([user_id, str(hashed_input)])

            asyncio.ensure_future(
                request.app['redis_conn'].incr('extra_sample_layers'))

            result = await request.app['redis_conn'].get(f_name)
            if result:
                asyncio.ensure_future(
                    request.app['redis_conn'].pexpire(f_name, 43200000))
                return web.Response(text=''.join(
                    ['{"key":', str(hashed_input),
                     ',"file":', result.decode(), '}']))

            result = await geojson_to_topojson(data, layer_name)
            if not result:
                return web.Response(
                    text='{"Error": "Error converting input file"}')
            else:
                asyncio.ensure_future(
                    request.app['redis_conn'].set(
                        f_name, result, pexpire=43200000))

            return web.Response(text=''.join(
                ['{"key":', str(hashed_input), ',"file":', result, '}']))


async def carto_doug(posted_data, user_id, app):
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, str(posted_data['topojson'])])
    ref_layer = await app['redis_conn'].get(f_name)
    ref_layer = json.loads(ref_layer.decode())
    new_field = posted_data['var_name']
    iterations = int(posted_data['iterations'])
    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_field_topojson(ref_layer, new_field[n_field_name], n_field_name)
    with TemporaryDirectory() as tmp_dir:
        tmp_path = path_join(tmp_dir, '{}.geojson'.format(get_name()))
        savefile(tmp_path, topojson_to_geojson(ref_layer).encode())

        result = await app.loop.run_in_executor(
            app["ThreadPool"],
            make_carto_doug,
            tmp_path, n_field_name, iterations)

        new_name = '_'.join(["Carto_doug", str(iterations), n_field_name])
        res = await geojson_to_topojson(result, new_name)
        hash_val = mmh3_hash(res)
        asyncio.ensure_future(
            app['redis_conn'].set('_'.join([
                user_id, str(hash_val)]), res, pexpire=43200000))

        return ''.join(['{"key":', str(hash_val), ',"file":', res, '}'])

# async def compute_discont(posted_data, user_id, app):
#     st = time.time()
#     posted_data = json.loads(posted_data.get("json"))
#     f_name = '_'.join([user_id, str(posted_data['topojson']), "NQ"])
#     ref_layer = await app['redis_conn'].get(f_name)
#     ref_layer = json.loads(ref_layer.decode())
#     new_field = posted_data['join_field']
#
#     n_field_name = list(new_field.keys())[0]
#     if len(new_field[n_field_name]) > 0:
#         join_field_topojson(ref_layer, new_field[n_field_name], n_field_name)
#     ref_layer_geojson = convert_from_topo(ref_layer)
#     tmp_part = get_name()
#     tmp_path = ''.join(['/tmp/', tmp_part, '.geojson'])
#     with open(tmp_path, 'wb') as f:
#         f.write(json.dumps(ref_layer_geojson).encode())
#     new_topojson = await geojson_to_topojson(tmp_path, "-q 1e3")
#     new_topojson = json.loads(new_topojson)
#     res_geojson = app.loop.run_in_executor(
#         app["ProcessPool"],
#         get_borders_to_geojson,
#         new_topojson
#         )
#     savefile(tmp_path, res_geojson)
#     res = await geojson_to_topojson(tmp_path)
#     new_name = ''.join(["Discont_", n_field_name])
#     res = res.replace(tmp_part, new_name)
#     hash_val = mmh3_hash(res)
#     asyncio.ensure_future(
#         app['redis_conn'].set('_'.join([
#             user_id, str(hash_val), "NQ"]), res, pexpire=86400000))
#     app['logger'].info(
#         '{} - timing : dicont_on_py : {:.4f}s'
#         .format(user_id, time.time()-st))
#
#     return ''.join(['{"key":', str(hash_val), ',"file":', res, '}'])


async def links_map(posted_data, user_id, app):
    posted_data = json.loads(posted_data.get("json"))

    f_name = '_'.join([user_id, str(posted_data['topojson'])])
    ref_layer = await app['redis_conn'].get(f_name)
    ref_layer = json.loads(ref_layer.decode())
    new_field = posted_data['join_field']

    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_field_topojson(ref_layer, new_field[n_field_name], n_field_name)
    ref_layer = convert_from_topo(ref_layer)

    result_geojson = await app.loop.run_in_executor(
        app["ThreadPool"],
        make_geojson_links,
        ref_layer,
        posted_data["csv_table"],
        posted_data["field_i"],
        posted_data["field_j"],
        posted_data["field_fij"],
        n_field_name)

    new_name = 'LinksLayer'
    res = await geojson_to_topojson(result_geojson, new_name)
    hash_val = mmh3_hash(res)
    asyncio.ensure_future(
        app['redis_conn'].set('_'.join([
            user_id, str(hash_val)]), res, pexpire=43200000))

    return ''.join(['{"key":', str(hash_val), ',"file":', res, '}'])


async def carto_gridded_point(posted_data, user_id, app):
    posted_data = json.loads(posted_data.get("json"))

    # Fetch the target layer:
    f_name = '_'.join([user_id, str(posted_data['topojson'])])
    ref_layer = await app['redis_conn'].get(f_name)
    ref_layer = json.loads(ref_layer.decode())

    # Join a new field of value if necessary:
    if posted_data['var_name']:
        new_field = posted_data['var_name']

        n_field_name = list(new_field.keys())[0]
        if len(new_field[n_field_name]) > 0:
            join_field_topojson(ref_layer, new_field[n_field_name], n_field_name)
    else:
        n_field_name = None

    with TemporaryDirectory() as tmp_dir:
        # Prepare the temporary filenames for the input layer(s) and for the result:
        filenames = {
            'src_layer': path_join(tmp_dir, '{}.geojson'.format(get_name())),
            'polygon_layer': path_join(tmp_dir, '{}.geojson'.format(get_name()))
            if posted_data['polygon_layer'] else None,
            'mask_layer': path_join(tmp_dir, '{}.geojson'.format(get_name()))
            if posted_data['mask_layer'] else None,
            'result': None
        }

        # Save the necessary layer on the disk:
        savefile(
            filenames['src_layer'],
            topojson_to_geojson(ref_layer).encode())

        if posted_data['mask_layer']:
            f_name = '_'.join([user_id, str(posted_data['mask_layer'])])
            mask_layer = await app['redis_conn'].get(f_name)
            savefile(
                filenames['mask_layer'],
                topojson_to_geojson(json.loads(mask_layer.decode())).encode())

        if posted_data['polygon_layer']:
            f_name = '_'.join([user_id, str(posted_data['polygon_layer'])])
            polygon_layer = await app['redis_conn'].get(f_name)
            savefile(
                filenames['polygon_layer'],
                topojson_to_geojson(json.loads(polygon_layer.decode())).encode())

        # Compute the result:
        result_geojson = await app.loop.run_in_executor(
            app["ProcessPool"],
            get_grid_layer_pt,
            filenames['src_layer'],
            posted_data["cellsize"],
            n_field_name,
            posted_data["grid_shape"].lower(),
            filenames['mask_layer'],
            filenames['polygon_layer'],
            posted_data['func_type'],
        )

        # Rename the result layer:
        new_name = '_'.join(['Gridded',
                             str(posted_data["cellsize"]),
                             n_field_name or ''])
        # Convert the result layer to TopoJSON:
        res = await geojson_to_topojson(result_geojson.encode(), new_name)

        # Store it in redis:
        hash_val = str(mmh3_hash(res))
        asyncio.ensure_future(
            app['redis_conn'].set('_'.join([
                user_id, hash_val]), res, pexpire=43200000))

        # Return it to the user:
        return ''.join(['{"key":', hash_val, ',"file":', res, '}'])


async def carto_gridded(posted_data, user_id, app):
    posted_data = json.loads(posted_data.get("json"))

    f_name = '_'.join([user_id, str(posted_data['topojson'])])
    ref_layer = await app['redis_conn'].get(f_name)

    ref_layer = json.loads(ref_layer.decode())
    new_field = posted_data['var_name']

    n_field_name = list(new_field.keys())[0]
    if len(new_field[n_field_name]) > 0:
        join_field_topojson(ref_layer, new_field[n_field_name], n_field_name)
    with TemporaryDirectory() as tmp_dir:
        filenames = {
            "src_layer": path_join(tmp_dir, '{}.geojson'.format(get_name())),
            "result": None
        }
        savefile(filenames['src_layer'],
                 topojson_to_geojson(ref_layer).encode())

        result_geojson = await app.loop.run_in_executor(
            app["ProcessPool"],
            get_grid_layer,
            filenames['src_layer'],
            posted_data["cellsize"],
            n_field_name,
            posted_data["grid_shape"].lower())

        new_name = '_'.join(['Gridded',
                             str(posted_data["cellsize"]),
                             n_field_name])
        res = await geojson_to_topojson(result_geojson.encode(), new_name)

        hash_val = str(mmh3_hash(res))
        asyncio.ensure_future(
            app['redis_conn'].set('_'.join([
                user_id, hash_val]), res, pexpire=43200000))
        return ''.join(['{"key":', hash_val, ',"file":', res, '}'])


async def compute_olson(posted_data, user_id, app):
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, str(posted_data['topojson'])])

    ref_layer = await app['redis_conn'].get(f_name)
    ref_layer = json.loads(ref_layer.decode())

    scale_values = posted_data['scale_values']
    ref_layer_geojson = convert_from_topo(ref_layer)

    await app.loop.run_in_executor(
        app["ThreadPool"],
        olson_transform,
        ref_layer_geojson,
        scale_values)

    new_name = "_".join(["Olson_carto", str(posted_data["field_name"])])
    res = await geojson_to_topojson(
        json.dumps(ref_layer_geojson).encode(), new_name)
    hash_val = str(mmh3_hash(res))
    asyncio.ensure_future(
        app['redis_conn'].set('_'.join([
            user_id, hash_val]), res, pexpire=43200000))
    return ''.join(['{"key":', hash_val, ',"file":', res, '}'])


async def compute_stewart(posted_data, user_id, app):
    posted_data = json.loads(posted_data.get("json"))
    f_name = '_'.join([user_id, str(posted_data['topojson'])])
    point_layer = await app['redis_conn'].get(f_name)
    point_layer = json.loads(point_layer.decode())

    new_field1 = posted_data['variable1']
    new_field2 = posted_data['variable2']

    n_field_name1 = list(new_field1.keys())[0]
    if len(new_field1[n_field_name1]) > 0:
        join_field_topojson(point_layer, new_field1[n_field_name1],
                            n_field_name1)

    if new_field2:
        discretization = "percentiles"
        n_field_name2 = list(new_field2.keys())[0]
        if len(new_field2[n_field_name2]) > 0:
            join_field_topojson(point_layer, new_field2[n_field_name2],
                                n_field_name2)
    else:
        discretization = "jenks"
        n_field_name2 = None

    if posted_data['mask_layer']:
        f_name = '_'.join([user_id, str(posted_data['mask_layer'])])
        mask_layer = await app['redis_conn'].get(f_name)

    with TemporaryDirectory() as tmp_dir:
        tmp_part = get_name()
        filenames = {
            'point_layer': path_join(tmp_dir, '{}.geojson'.format(get_name())),
            'mask_layer': path_join(tmp_dir, '{}.geojson'.format(get_name()))
            if posted_data['mask_layer'] != "" else None
        }
        savefile(filenames['point_layer'],
                 topojson_to_geojson(point_layer).encode())

        if filenames['mask_layer']:
            savefile(
                filenames['mask_layer'],
                topojson_to_geojson(json.loads(mask_layer.decode())).encode())

        res, breaks = await app.loop.run_in_executor(
            app["ProcessPool"],
            quick_stewart_mod,
            filenames['point_layer'],
            n_field_name1,
            int(posted_data['span']),
            float(posted_data['beta']),
            posted_data['typefct'].lower(),
            int(posted_data['nb_class']),
            discretization,
            posted_data['resolution'],
            filenames["mask_layer"],
            n_field_name2,
            posted_data['user_breaks'])

        new_name = '_'.join(['Smoothed', n_field_name1])
        res = await geojson_to_topojson(res, new_name)
        hash_val = str(mmh3_hash(res))

        asyncio.ensure_future(
            app['redis_conn'].set('_'.join([
                user_id, hash_val]), res, pexpire=43200000))

        return "|||".join([
            ''.join(['{"key":', hash_val, ',"file":', res, '}']),
            json.dumps(breaks)
        ])


async def geo_compute(request):
    """
    Function dispatching between the various available fonctionalities
    (smoothed map, links creation, dougenik or olson cartogram, etc.)
    and returning (if nothing went wrong) the result to be added on the map.
    """
    s_t = time.time()
    function = request.match_info['function']
    if function not in request.app['geo_function']:
        return web.Response(text=json.dumps(
            {"Error": "Wrong function requested"}))
    else:
        posted_data, session_redis = \
            await asyncio.gather(*[request.post(), get_session(request)])
        user_id = get_user_id(session_redis, request.app['app_users'])
        func = request.app['geo_function'][function]
        request.app['logger'].info(
            'Dispatch between functions : {:.4f}s'.format(time.time()-s_t))
        s_t = time.time()
        try:
            data_response = await func(posted_data, user_id, request.app)
            asyncio.ensure_future(
                request.app['redis_conn'].lpush(
                    '{}_time'.format(function), time.time()-s_t))
            request.app['logger'].info(
                '{}: {:.4f}s'.format(function, time.time()-s_t))

        except (asyncio.CancelledError, CancelledError):
            request.app['logger'].info(
                'Cancelled after {:.4f}s : {}'
                .format(time.time()-s_t, function))
            data_response = json.dumps({})

        except TopologicalError as err:
            _tb = traceback.format_exc()
            request.app['logger'].info(
                'Error on "{}" after {:.4f}s\n{}'
                .format(function, time.time()-s_t, _tb))
            data_response = json.dumps({
                "Error": "Geometry error ({})".format(err)})

        except Exception as err:
            _tb = traceback.format_exc()
            request.app['logger'].info(
                'Error on \"{}\" after {:.4f}s\n{}'
                .format(function, time.time()-s_t, _tb))
            data_response = json.dumps({"Error": "{}".format(err)})

        return web.Response(text=data_response)


async def receiv_layer(request):
    """
    Store a layer sent (and created) in the UI (such as a discontinuity layer)
    in order to maybe use it later during the user session.
    """
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis, request.app['app_users'])
    layer_name = posted_data['layer_name']
    data = posted_data['geojson']
    h_val = mmh3_hash(data)
    f_name = '_'.join([user_id, str(h_val)])
    res = await geojson_to_topojson(data.encode(), layer_name)
    asyncio.ensure_future(
        request.app['redis_conn'].set(f_name, res, pexpire=43200000))
    return web.Response(text=''.join(['{"key":', str(h_val), '}']))


async def handler_exists_layer(request):
    """
    Function used when a layer is requested for the export of a project-file.
    The returned layer is in TopoJSON format.
    """
    session_redis = await get_session(request)
    user_id = get_user_id(session_redis, request.app['app_users'])
    res = await request.app['redis_conn'].get(
        '_'.join([user_id, request.match_info['expr']]))
    if res:
        return web.Response(
            text=res.decode().replace(''.join([user_id, "_"]), ''))
    else:
        return web.Response(text="")


async def handler_exists_layer2(request):
    """
    Function used when the user request a layer to be exported.
    """
    session_redis = await get_session(request)
    posted_data = await request.post()
    user_id = get_user_id(session_redis, request.app['app_users'])
    layer_name = posted_data.get('layer')
    layer_name_redis = posted_data.get('layer_name')
    file_format = posted_data.get('format')
    projection = json.loads(posted_data.get('projection'))
    res = await request.app['redis_conn'].get(
        '_'.join([user_id, layer_name_redis])
    )
    if not res:
        request.app['logger'].info(
            '{} - Unable to fetch the requested layer ({}/{})'
            .format(user_id, layer_name, layer_name_redis))
        return web.Response(
            text='{"Error": "Unable to fetch the layer on the server"}')

    try:
        if "TopoJSON" in file_format:
            return web.Response(text=res.decode())

        res_geojson = topojson_to_geojson(json.loads(res.decode()))

        if "GeoJSON" in file_format:
            return web.Response(text=res_geojson)

        elif "KML" in file_format:
            with TemporaryDirectory() as tmp_path:
                output_path = path_join(
                    tmp_path, "{}.geojson".format(layer_name))
                savefile(output_path, res_geojson.encode())
                result = reproj_convert_layer_kml(output_path)
                return web.Response(text=result.decode())

        elif 'Shapefile' in file_format or 'GML' in file_format:
            out_proj = check_projection(
                projection["name"] if "name" in projection
                else projection["proj4string"])

            if not out_proj:
                return web.Response(text=json.dumps(
                    {'Error': 'app_page.common.error_proj4_string'}))

            ext = {"ESRI Shapefile": ".shp", "GML": ".gml"}[file_format]

            with TemporaryDirectory() as tmp_path:
                output_path = path_join(
                    tmp_path, "{}.geojson".format(layer_name))
                savefile(output_path, res_geojson.encode())
                reproj_convert_layer(
                    output_path, output_path.replace(".geojson", ext),
                    file_format, out_proj
                )
                raw_data, filename = zip_layer_folder(tmp_path, layer_name)
                b64_zip = b64encode(raw_data)
                return web.Response(
                    body=b64_zip,
                    headers=MultiDict({
                        "Content-Type": "application/octet-stream",
                        "Content-Disposition": ''.join(
                            ["attachment; filename=", filename]),
                        "Content-length": str(len(b64_zip))
                    }))

    except Exception as err:
        request.app['logger'].info(
            '{} - Error {} while converting layer {} to {} format)'
            .format(user_id, err, layer_name, file_format))
        return web.Response(text='{"Error": "Unexpected error"}')

    return web.Response(text='{"Error": "Invalid file format"}')


async def rawcsv_to_geo(data, logger):
    """
    Actually convert a csv file containing coordinates to a GeoJSON
    FeatureCollection of points.

    Parameters
    ----------
    data: str
        The csv file, as a string.
    logger: logging.Logger
        The logger to use to log info messages for errors or warnings.

    Returns
    -------
    geojson: str
        The resulting GeoJSON FeatureCollection.
    """
    # Determine what is the line separator in use:
    sp = '\r\n' if '\r\n' in data else '\n'
    # Remove "empty lines" if any
    # (sometimes some csv inputs are coming with one or more
    # line(s) containing only commas)
    data = [d for d in data.split(sp) if not all((c == ',') for c in d)]
    data.append(sp)
    data = sp.join(data)
    # Determine what is the separator for values (either comma, colon or tab):
    separator = guess_separator(None, data)

    # Create a dataframe from our csv data:
    df = pd.read_csv(StringIO(data), sep=separator)
    # Replace spaces in columns names:
    df.columns = [i.replace(' ', '_') for i in df.columns]
    # Fetch the name of the column containing latitude coordinates
    geo_col_y, name_geo_col_y = [
        (colnb + 1, col) for colnb, col in enumerate(df.columns)
        if col.lower() in {"y", "latitude", "lat"}
    ][0]
    # Fetch the name of the column containing longitude coordinates
    geo_col_x, name_geo_col_x = [
        (colnb + 1, col) for colnb, col in enumerate(df.columns)
        if col.lower() in {"x", "longitude", "lon", "lng", "long"}
    ][0]
    # Drop records containing empty values for latitude and/or longitude:
    df.dropna(subset=[name_geo_col_x, name_geo_col_y], inplace=True)
    # Replace NaN values by empty string (some column type might be changed to
    # 'Object' if thay contains empty values)
    df.replace(np.NaN, '', inplace=True)
    # Let's try to be sure there isn't empty values
    # in the latitude/longitude columns:
    try:
        if df[name_geo_col_x].dtype == object:
            df = df[df[name_geo_col_x] != '']
        if df[name_geo_col_y].dtype == object:
            df = df[df[name_geo_col_y] != '']
    except Exception as err:
        logger.info(
            'Latitude/Longitude columns filtering failed:'
            '\n{}'.format(err))
    # Try to convert the coordinates to float by applying the operation to the
    # whole column :
    # (can fail if some cells are containing 'bad' values)
    try:
        if df[name_geo_col_x].dtype == object:
            df[name_geo_col_x] = df[name_geo_col_x].apply(
                lambda x: x.replace(',', '.') if hasattr(x, 'replace') else x)
            df[name_geo_col_x] = df[name_geo_col_x].astype(float)
        if df[name_geo_col_y].dtype == object:
            df[name_geo_col_y] = df[name_geo_col_y].apply(
                lambda x: x.replace(',', '.') if hasattr(x, 'replace') else x)
            df[name_geo_col_y] = df[name_geo_col_y].astype(float)
    except Exception as err:
        _tb = traceback.format_exc(limit=1)
        logger.info(
            'Latitude/Longitude columns conversion failed using \'astype\':'
            '\n{}\n{}'.format(err, _tb))
        # Conversion failed so we are gonna look in each cell of the x and y
        # columns and creating a boolean array based on wheter
        # the x and y columns contains number:
        reg = re.compile('[+-]?\d+(?:\.\d+)?')
        mat = df[[name_geo_col_x, name_geo_col_y]].applymap(
            lambda x: True if re.match(reg, x) else False)
        # Use that boolean array to filter the dataframe:
        df = df[(mat[name_geo_col_x] & mat[name_geo_col_y])]
        # Try the conversion again :
        try:
            df[name_geo_col_x] = df[name_geo_col_x].apply(
                lambda x: x.replace(',', '.') if hasattr(x, 'replace') else x)
            df[name_geo_col_y] = df[name_geo_col_y].apply(
                lambda x: x.replace(',', '.') if hasattr(x, 'replace') else x)
            df[name_geo_col_x] = df[name_geo_col_x].astype(float)
            df[name_geo_col_y] = df[name_geo_col_y].astype(float)
        except Exception as err:
            _tb = traceback.format_exc(limit=2)
            logger.info(
                'Latitude/Longitude columns conversion failed after filtering'
                'using regex:\n{}\n{}'.format(err, _tb))
            return None

    # Prepare the name of the columns to keep:
    columns_to_keep = [
        (n + 1, i) for n, i in enumerate(df.columns)
        if i not in (name_geo_col_x, name_geo_col_y)]

    features = []
    # Create the new features:
    for ft in df.itertuples():
        new_ft = {
            "geometry": {
                "type": "Point",
                "coordinates": [ft[geo_col_x], ft[geo_col_y]]
            },
            "properties": {},
            "type": "Feature"
        }
        for nb_c, name_c in columns_to_keep:
            new_ft['properties'][name_c] = ft[nb_c]
        features.append(new_ft)

    return json.dumps({
        "type": "FeatureCollection",
        "features": features,
    })


async def calc_helper(request):
    """
    Compute basic operation between two arrays (in order to create a new column
    on a layer when the user request it).
    This computation happens on the server only when there is
    too many features to handle it in the user browser.
    """
    posted_data = await request.post()
    val1 = np.array(json.loads(posted_data['var1']))
    val2 = np.array(json.loads(posted_data['var2']))
    allowed_types = {"i", "f"}
    if val1.dtype.kind not in allowed_types:
        try:
            val1 = val1.astype(float, copy=False)
        except:
            return web.Response(text='{"Error":"Invalid datatype"}')
    if val2.dtype.kind not in allowed_types:
        try:
            val2 = val2.astype(float, copy=False)
        except:
            return web.Response(text='{"Error":"Invalid datatype"}')
    result = await request.app.loop.run_in_executor(
        request.app['ThreadPool'],
        run_calc, val1, val2, posted_data['operator'])
    return web.Response(text=result)


async def convert_csv_geo(request):
    """
    Handle the conversion of a csv file with coordinates to a TopoJSON layer, as
    the other layers uploaded in Magrit, and store the result in redis during
    the user session for a possible later use.
    """
    posted_data, session_redis = \
        await asyncio.gather(*[request.post(), get_session(request)])
    user_id = get_user_id(session_redis, request.app['app_users'])
    st = time.time()
    file_name = posted_data.get("filename")
    data = posted_data.get("csv_file")
    hash_val = str(mmh3_hash(data))

    f_name = '_'.join([user_id, hash_val])

    result = await request.app['redis_conn'].get(f_name)
    if result:
        return web.Response(text=''.join(
            ['{"key":', hash_val, ',"file":', result.decode(), '}']))

    # Convert the csv file to a GeoJSON file:
    res = await rawcsv_to_geo(data, request.app['logger'])
    if not res:
        return web.Response(text=json.dumps(
            {'Error': 'An error occured when trying to convert a tabular file'
             '(containing coordinates) to a geographic layer'}))

    # Convert the GeoJSON file to a TopoJSON file:
    result = await geojson_to_topojson(res.encode(), file_name)
    if not result:
        return web.Response(text=json.dumps(
            {'Error': 'An error occured when trying to convert a tabular file'
             '(containing coordinates) to a geographic layer'}))

    asyncio.ensure_future(
        request.app['redis_conn'].set(
            f_name, result, pexpire=43200000))

    request.app['logger'].info(
        'timing : csv -> geojson -> topojson : {:.4f}s'
        .format(time.time() - st))

    return web.Response(text=''.join(
        ['{"key":', hash_val, ',"file":', result, '}']
    ))


async def get_stats_json(request):
    posted_data = await request.post()
    if not ('data' in posted_data
            and mmh3_hash(posted_data['data']) == 1163649321):
        return web.Response()
    redis_conn = request.app['redis_conn']
    stewart, doug, gridded, gridded_pt, olson, links = await asyncio.gather(*[
        redis_conn.lrange('stewart_time', 0, -1),
        redis_conn.lrange('carto_doug_time', 0, -1),
        redis_conn.lrange('gridded_time', 0, -1),
        redis_conn.lrange('gridded_point_time', 0, -1),
        redis_conn.lrange('olson_time', 0, -1),
        redis_conn.lrange('links_time', 0, -1),
    ])
    layers, sample_layers, extra_sample_layers = await asyncio.gather(*[
        redis_conn.get('layers'),
        redis_conn.get('sample_layers'),
        redis_conn.get('extra_sample_layers'),
    ])
    view_onepage, single_view_onepage = await asyncio.gather(*[
        redis_conn.get('view_onepage'),
        redis_conn.get('single_view_onepage'),
    ])
    count = await redis_conn.get('single_view_modulepage')
    return web.Response(text=json.dumps({
        "view_onepage": view_onepage,
        "single_view_onepage": single_view_onepage,
        "count": count,
        "layer": layers,
        "sample": sample_layers,
        "extra_sample_layers": extra_sample_layers,
        "t": {
            "stewart": stewart, "dougenik": doug,
            "gridded": gridded, "gridded_point": gridded_pt,
            "olson": olson, "links": links
        }
    }))


async def convert_tabular(request):
    """
    Handle the conversion of a tabular file (xls, ods or xlsx) to a csv file
    and return the result in the browser.
    If the tabular file contains multiple sheets, only the first one is used.
    """
    st = time.time()
    posted_data = await request.post()

    # For xls, ods and xlsx files :
    allowed_datatypes = (
        "application/octet-stream",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.oasis.opendocument.spreadsheet")

    _file = posted_data.get('file[]')
    name, data, datatype = _file.filename, _file.file, _file.content_type
    if datatype in allowed_datatypes:
        name, extension = name.rsplit('.', 1)
        book = get_book(file_content=data.read(), file_type=extension)
        sheet_names = book.sheet_names()
        csv = book[sheet_names[0]].csv
        # replace spaces in variable names
        firstrowlength = csv.find('\n')
        result = csv[0:firstrowlength].replace(' ', '_') + csv[firstrowlength:]
        message = ["app_page.common.warn_multiple_sheets", sheet_names] \
            if len(sheet_names) > 1 else None
    else:
        result = "Unknown tabular file format"
        request.app['logger'].info(
            'Unknown tabular file format : {} / {}'
            .format(name, datatype))
        message = None

    request.app['logger'].info(
        'timing : spreadsheet -> csv : {:.4f}s'
        .format(time.time() - st))
    return web.Response(text=json.dumps(
        {"file": result, "name": name, "message": message}))


async def fetch_list_extrabasemaps(loop):
    url = 'https://api.github.com/repos/riatelab/basemaps/contents/'
    async with ClientSession(loop=loop) as client:
        async with client.get(url) as resp:
            assert resp.status == 200
            data = await resp.text()
            data = json.loads(data)
            tree_url = [d for d in data
                        if d['name'] == "Countries"][0]['_links']['git']
            base_url = ('https://raw.githubusercontent.com/riatelab/basemaps'
                        '/master/Countries/')
            async with client.get(tree_url + '?recursive=1') as resp:
                assert resp.status == 200
                list_elem = await resp.text()
                list_elem = json.loads(list_elem)
                name_url = []
                for elem in list_elem['tree']:
                    if '.geojson' in elem['path']:
                        p = elem['path']
                        url = base_url + p
                        filename = p.split('/')[0]
                        name_url.append((filename, url))
                return name_url


async def get_extrabasemaps(request):
    list_url = await request.app['redis_conn'].get('extrabasemaps')
    if not list_url:
        list_url = await fetch_list_extrabasemaps(request.app.loop)
        list_url = json.dumps(list_url)
        asyncio.ensure_future(request.app['redis_conn'].set(
            'extrabasemaps', list_url.encode(), pexpire=21600000))
        return web.Response(text=list_url)
    else:
        return web.Response(text=list_url.decode())


def prepare_list_svg_symbols():
    """
    Function to prepare (when the server application is started) the JSON file
    containing the list of available symbols (which may be used as layout
    features on the map). That list is fetched when the application is opened
    client side.
    """
    symbols = [i for i in os.listdir("static/img/svg_symbols/") if '.png' in i]
    with open("static/json/list_symbols.json", "w") as f:
        f.write(json.dumps(symbols))


def check_valid_ip(addr):
    """
    Determine if a given string is a valid IPv4 address.

    Parameters
    ----------
    addr: str
        The address to be tested.

    Returns
    -------
    boolean
        Wheter the string is a valid IPv4 address.
    """
    try:
        addr_valid = ip_address(addr)
        return True
    except:
        return False


def check_port_available(addr, port_nb):
    """
    Determine if a given port is currently available.

    Parameters
    ----------
    addr: str
        The address to be tested.

    port_nb: int
        The port number to check.

    Returns
    -------
    boolean
        Wheter the port is available or not.
    """
    if port_nb < 7000:
        return False
    with closing(socket(AF_INET, SOCK_STREAM)) as sock:
        if sock.connect_ex((addr, port_nb)) == 0:
            return False
    return True


def get_version():
    """
    Get the current version of the Magrit application by reading the __init__.py
    file (it's actually the only place where the version number is written).
    The returned value will be used/displayed client side.
    """
    with open('__init__.py', 'r') as f:
        ver = f.read()
    ix = ver.find("'")
    return ver[ix+1:ix + ver[ix+1:].find("'")+1]


async def on_shutdown(app):
    """
    Function triggered when the application exits normally.
    """
    await app["redis_conn"].quit()
    app["ProcessPool"].shutdown()
    app["ThreadPool"].shutdown()
    for task in asyncio.Task.all_tasks():
        await asyncio.sleep(0)
        info = task._repr_info()
        if "RedisPool" in info[1] and "pending" in info[0]:
            try:
                await asyncio.wait_for(task, 2)
            except asyncio.TimeoutError:
                task.cancel()
        elif "Application.shutdown()" not in info[1]:
            task.cancel()


async def init(loop, addr='0.0.0.0', port=None, watch_change=False, use_redis=True, redis_addr=None):
    """
    Function creating the various routes for the application and setting up
    middlewares (for custom 404 error page and redis cookie storage).
    """
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("magrit_app.main")
    if use_redis:
        from aioredis import create_pool, create_redis_pool
        # redis server address defaults to application server address if not
        # specified at this point, which is happening when testing with unittest
        # or when launching it with gunicorn with default options
        if not redis_addr:
            redis_addr = addr
        # redis connection used for server side cookie storage:
        redis_cookie = await create_pool(
            (redis_addr, 6379), db=0, maxsize=50, loop=loop)
        # redis connection used for temporarily storing layers:
        redis_conn = await create_redis_pool(
            (redis_addr, 6379), db=1, loop=loop)
        app = web.Application(
            loop=loop,
            client_max_size=17408**2,
            middlewares=[
                error_middleware,
                session_middleware(redis_storage.RedisStorage(redis_cookie))])
        app['redis_conn'] = redis_conn
    else:
        from helpers.fakeredis import FakeAioRedisConnection
        fernet_key = fernet.Fernet.generate_key()
        secret_key = urlsafe_b64decode(fernet_key)
        app = web.Application(
            loop=loop,
            client_max_size=17408**2,
            middlewares=[error_middleware])
        aiohttp_session_setup(
            app, cookie_storage.EncryptedCookieStorage(secret_key))
        app['redis_conn'] = FakeAioRedisConnection(max_age_seconds=3600)

    add_route = app.router.add_route
    add_route('GET', '/', index_handler)
    add_route('GET', '/index', index_handler)
    add_route('GET', '/contact', serve_contact_form)
    add_route('GET', '/modules', serve_main_page)
    add_route('GET', '/modules/', serve_main_page)
    add_route('GET', '/modules/{expr}', serve_main_page)
    add_route('POST', '/layers/add', receiv_layer)
    add_route('POST', '/layers/delete', remove_layer)
    add_route('GET', '/extrabasemaps', get_extrabasemaps)
    add_route('GET', '/get_layer/{expr}', handler_exists_layer)
    add_route('POST', '/get_layer2', handler_exists_layer2)
    add_route('POST', '/compute/{function}', geo_compute)
    add_route('POST', '/stats', get_stats_json)
    add_route('POST', '/sample', get_sample_layer)
    add_route('POST', '/convert_to_topojson', convert)
    add_route('POST', '/convert_topojson', convert_topo)
    add_route('POST', '/convert_csv_geo', convert_csv_geo)
    add_route('POST', '/convert_extrabasemap', convert_extrabasemap)
    add_route('POST', '/convert_tabular', convert_tabular)
    add_route('POST', '/helpers/calc', calc_helper)
    app.router.add_static('/static/', path='static', name='static')

    # Store in the 'app' variable a reference to each variable we will need
    # to reuse a various place (to avoid global variables):
    app['app_users'] = set()
    app['logger'] = logger
    app['version'] = get_version()
    with open('static/json/sample_layers.json', 'r') as f:
        app['db_layers'] = {n['name']: n['path'] for n in json.loads(f.read())}
    app['ThreadPool'] = ThreadPoolExecutor(6)
    app['ProcessPool'] = \
        ProcessPoolExecutor(6) if not IS_WINDOWS else ThreadPoolExecutor(6)
    app['app_name'] = "Magrit"
    app['geo_function'] = {
        "stewart": compute_stewart,
        "gridded": carto_gridded,
        "gridded_point": carto_gridded_point,
        "links": links_map,
        "carto_doug": carto_doug,
        "olson": compute_olson
    }
    if watch_change:
        webpack_logger = logging.getLogger("webpack")
        asyncio.ensure_future(execute(
            webpack_logger,
            'cd ../client && ./node_modules/webpack/bin/webpack.js --watch'))

    app.on_shutdown.append(on_shutdown)
    prepare_list_svg_symbols()
    # If port is None the application is started for unittests or by Gunicorn:
    if not port:
        return app
    # If a port is specified the application is started "directly" and
    # we need to create the server :
    else:
        handler = app.make_handler()
        srv = await loop.create_server(handler, addr, port)
        return srv, app, handler


async def log_stream(log, stream):
    while not stream.at_eof():
        data = await stream.readline()
        line = data.decode().rstrip()
        log(line)


async def execute(logger, command):
    proc = await asyncio.create_subprocess_shell(command,
                                                 stdout=PIPE,
                                                 stderr=PIPE)
    await asyncio.wait([
        asyncio.ensure_future(log_stream(logger.info, proc.stdout)),
        asyncio.ensure_future(log_stream(logger.error, proc.stderr)),
        asyncio.ensure_future(proc.wait())
    ])


def _init(loop):
    """
    "Special" entry point used when running py.test unittests :
    """
    app_real_path = os.path.dirname(os.path.realpath(__file__))
    if app_real_path != os.getcwd():
        os.chdir(app_real_path)
    # GEO2TOPO_PATH = find_geo2topo()
    # if not GEO2TOPO_PATH:
    #     sys.exit(1)
    return init(loop)


def create_app(redis_addr=None):
    """
    Entry point when using Gunicorn to run the application with something like :
    $ gunicorn "magrit_app.app:create_app()" \
      --bind 0.0.0.0:9999 \
      --worker-class aiohttp.worker.GunicornUVLoopWebWorker --workers 2
    """
    app_real_path = os.path.dirname(os.path.realpath(__file__))
    if app_real_path != os.getcwd():
        os.chdir(app_real_path)
    global GEO2TOPO_PATH
    GEO2TOPO_PATH = find_geo2topo()
    if not GEO2TOPO_PATH:
        sys.exit('Unable to find required `geo2topo` binary.')
    if redis_addr:
        if not check_valid_ip(redis_addr):
            sys.exit('Invalid redis server address.')
    loop = asyncio.get_event_loop()
    app = loop.run_until_complete(init(loop, port=None, redis_addr=redis_addr))
    return app


def main():
    """
    Entry point used when the application is started directly like :
    $ ./magrit_app/app.py --port 9999

    Or when installed and started like :
    $ magrit --port 9999
    """
    app_real_path = os.path.dirname(os.path.realpath(__file__))

    if app_real_path != os.getcwd():
        os.chdir(app_real_path)

    version = get_version()

    global GEO2TOPO_PATH
    GEO2TOPO_PATH = find_geo2topo()
    if not GEO2TOPO_PATH:
        sys.exit('Unable to find required `geo2topo` binary.')

    arguments = docopt.docopt(__doc__, version='Magrit ' + version)
    if not arguments["--port"].isnumeric():
        print(__doc__[__doc__.find("Usage:"):__doc__.find("\nOptions")])
        sys.exit("Error: Invalid port value")

    port = int(arguments["--port"])
    addr = arguments['--addr']

    if not check_valid_ip(addr):
        print(__doc__[__doc__.find("Usage:"):__doc__.find("\nOptions")])
        sys.exit("Error : Selected server address is not valid")

    if not check_port_available(addr, port):
        print(__doc__[__doc__.find("Usage:"):__doc__.find("\nOptions")])
        sys.exit("Error : Selected port is already in use")

    watch_change = True if arguments['--dev'] else False
    use_redis = False \
        if arguments['--standalone'] or IS_WINDOWS or IS_FROZEN \
        else True

    if arguments['--redis-addr'] and use_redis:
        redis_addr = arguments['--redis-addr']
        if not check_valid_ip(redis_addr):
            print(__doc__[__doc__.find("Usage:"):__doc__.find("\nOptions")])
            sys.exit("Error : Selected redis server address is not valid")
    else:
        redis_addr = addr

    if uvloop:
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

    loop = asyncio.get_event_loop()
    asyncio.set_event_loop(loop)
    srv, app, handler = loop.run_until_complete(
        init(loop, addr, port, watch_change, use_redis, redis_addr))

    app['logger'].info('serving on' + str(srv.sockets[0].getsockname()))

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.close()
        loop.run_until_complete(srv.wait_closed())
        loop.run_until_complete(app.shutdown())
        loop.run_until_complete(handler.shutdown(60.0))
        loop.run_until_complete(app.cleanup())
    loop.close()


if __name__ == '__main__':
    main()
