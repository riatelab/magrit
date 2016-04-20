# -*- coding: utf-8 -*-
"""
@author: mz
"""
import os
import sys
import ujson as json
import time

from zipfile import ZipFile
from random import choice
from datetime import datetime
from hashlib import sha512
import asyncio
import zmq.asyncio
from subprocess import Popen, PIPE

# Web related stuff :
import jinja2
import aiohttp_jinja2
from aiohttp import web
import aioredis
from aiohttp_session import get_session, session_middleware, redis_storage

from r_py.rclient_load_balance_auto_scale import R_client_fuw_async, url_client
from helpers.misc import try_float, savefile, get_key, hash_md5_file
from pytopojson import topo_to_geo

pp = '(aiohttp_app) '


def get_name(length=25):
    """
    Find a temporary random name to share object
    with some external soft used ( R / ogr2ogr / topojson / etc.)
    Aimed to be remplaced by something better
    """
    return ''.join([bytes([choice(list(range(48, 58))
                                  + list(range(65, 91))
                                  + list(range(97, 123)))]).decode()
                    for i in range(length)])


@aiohttp_jinja2.template('index.html')
@asyncio.coroutine
def handler(request):
    session = yield from get_session(request)
    if 'last_visit' in session:
        date = 'Last visit : {}'.format(datetime.fromtimestamp(
                session['last_visit']).strftime("%B %d, %Y at %H:%M:%S"))
    else:
        date = ''
    session['last_visit'] = time.time()
    return {'last_visit': date}


@asyncio.coroutine
def is_known_user(request, ref):
    session = yield from get_session(request)
    if 'R_user' in session and session['R_user'] in ref:
        id_ = session['R_user']
        assert id_ in ref
        print(session['R_user'], ' is a kwown user')
    else:
        id_ = get_key(var=ref)
        session['R_user'] = id_
        ref[id_] = [True, None]
        print(session['R_user'], ' is a new user')
    return id_


##########################################################
#### A few functions to open (server side) a table or
#### ... a geo layer uploaded by the user and display
#### ... some informations.
##########################################################
#### These functions are currently totaly insecure

def ogr_to_geojson(filepath, to_latlong=True):
    # Todo : Rewrite using asyncio.subprocess methods
    if to_latlong:
        process = Popen(["ogr2ogr", "-f", "GeoJSON",
                         "-preserve_fid",
                         "-t_srs", "EPSG:4326",
                         "/dev/stdout", filepath], stdout=PIPE)
    else:
        process = Popen(["ogr2ogr", "-f", "GeoJSON", "-preserve_fid",
                         "/dev/stdout", filepath], stdout=PIPE)
    stdout, _ = process.communicate()
    return stdout.decode()

def geojson_to_topojson(filepath):
    # Todo : Rewrite using asyncio.subprocess methods
    # Todo : Use topojson python port if possible to avoid writing a temp. file
    process = Popen(["topojson", "--spherical", "--bbox", "true",
                     "-p", "--", filepath], stdout=PIPE)
    stdout, _ = process.communicate()
    os.remove(filepath)
    return stdout.decode()

def topojson_to_geojson(data):
    # Todo : Rewrite using asyncio.subprocess methods
    # Todo : Use topojson python port if possible to avoid writing a temp. file
    layer_name = list(data['objects'].keys())[0]
    f_path = ''.join(['/tmp/', layer_name, '.topojson'])
    with open(f_path, 'wb') as f:
        f.write(json.dumps(data).encode())
    new_path = f_path.replace('topojson', 'json')
    process = Popen(["topojson-geojson", f_path, "-o", '/tmp'])
    process.wait()
    with open(new_path, 'r') as f:
        data = f.read()
    os.remove(f_path)
    os.remove(new_path)
    return data

@asyncio.coroutine
def cache_input_topojson(request):
    posted_data = yield from request.post()
    try:
        name, data = posted_data.getall('file[]')
        hashed_input = sha512(data.encode()).hexdigest() # Todo : compute the hash on client side to avoid re-sending the data
        print('Here i am')
    except Exception as err:
        print("posted data :\n", posted_data)
        print("err\n", err)
        return web.Response(text=json.dumps({'Error': 'Incorrect datatype'}))

    session_redis = yield from get_session(request)
    user_id = get_user_id(session_redis)
    f_name = '_'.join([user_id, name.split('.')[0]])

    if not "converted" in session_redis:
        session_redis["converted"] = {}
    else:
        if hashed_input in session_redis['converted']:
            print("The TopoJSON was already cached !")
            return web.Response()

    session_redis['converted'][hashed_input] = True
    yield from app_glob['redis_conn'].set(f_name, data)
    print('Caching the TopoJSON')
    return web.Response()

def get_user_id(session_redis):
    if not 'app_user' in session_redis:
        user_id = get_key(app_glob['app_users'])
        app_glob['app_users'].add(user_id)
        session_redis['app_user'] = user_id
        return user_id
    else:
        user_id = session_redis['app_user']
        return user_id

@asyncio.coroutine
def user_pref(request):
    posted_data = yield from request.post()
    session = yield from get_session(request)
    session['map_pref'] = dict(posted_data)
    return web.Response(text=json.dumps({'Info': "I don't do anything with it rigth now!"}))

# Todo : Create a customizable route (like /convert/{format_Input}/{format_output})
# to easily handle file types send by the front-side ?
@asyncio.coroutine
def convert(request):
    posted_data = yield from request.post()

    # If a shapefile is provided as multiple files (.shp, .dbf, .shx, and .prj are expected), not ziped :
    if "action" in posted_data and not "file[]" in posted_data:
        list_files = []
        for i in range(len(posted_data) - 1):
            field = posted_data.getall('file[{}]'.format(i))[0]
            file_name = ''.join(['/tmp/', field[1]])
            list_files.append(file_name)
            savefile(file_name, field[2].read())
        shp_path = [i for i in list_files if 'shp' in i][0]
        hashed_input = hash_md5_file(shp_path)
        name = shp_path.split(os.path.sep)[2]
        datatype = "shp"

    # If there is a single file (geojson or zip) to handle :
    elif "action" in posted_data and "file[]" in posted_data:
        try:
            field = posted_data.get('file[]')
            name = field[1]
            data = field[2].read()
            datatype = field[3]
            hashed_input = sha512(data).hexdigest()
            filepath = os.path.join(
                app_glob['app_real_path'], app_glob['UPLOAD_FOLDER'], name)
        except Exception as err:
            print("posted data :\n", posted_data)
            print("err\n", err)
            return web.Response(text=json.dumps({'Error': 'Incorrect datatype'}))

    session_redis = yield from get_session(request)
    user_id = get_user_id(session_redis)
    
    f_name = '_'.join([user_id, name.split('.')[0]])

    if not "converted" in session_redis:
        session_redis["converted"] = {}
    else:
        if hashed_input in session_redis['converted']:
            result = yield from app_glob['redis_conn'].get(f_name)
            print("Used cached result")
            return web.Response(text=result.decode())

    if "shp" in datatype:
        res = ogr_to_geojson(shp_path, to_latlong=True)
        filepath2 = '/tmp/' + name.replace('.shp', '.geojson')
        with open(filepath2, 'w') as f:
            f.write(res)
        result = geojson_to_topojson(filepath2)
        session_redis['converted'][hashed_input] = True
        yield from app_glob['redis_conn'].set(f_name, result)
#        os.remove(filepath2)
        [os.remove(file) for file in list_files]

    elif 'zip' in datatype:
        with open(filepath+'archive', 'wb') as f:
            f.write(data)
        with ZipFile(filepath+'archive') as myzip:
            list_files = myzip.namelist()
            list_files = ['/tmp/' + i for i in list_files]
            shp_path = [i for i in list_files if 'shp' in i][0]
            layer_name = shp_path.split(os.path.sep)[2]
            myzip.extractall(path='/tmp')
            res = ogr_to_geojson(shp_path, to_latlong=True)
            filepath2 = '/tmp/' + layer_name.replace('.shp', '.geojson')
            with open(filepath2, 'w') as f:
                f.write(res)
            result = geojson_to_topojson(filepath2)
            session_redis['converted'][hashed_input] = True
            yield from app_glob['redis_conn'].set(f_name, result)
        os.remove(filepath+'archive')
#        os.remove(filepath2)
        [os.remove(file) for file in list_files]

    elif 'octet-stream' in datatype:
        data = data.decode()
        if '"crs"' in data and not '"urn:ogc:def:crs:OGC:1.3:CRS84"' in data:
            crs = True
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(data)
            res = ogr_to_geojson(filepath, to_latlong=True)
            print("Transform coordinates from GeoJSON")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(res)
        else:
            crs = False
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(data)

        result = geojson_to_topojson(filepath)
        if len(result) == 0 and not crs:
            result = json.dumps({'Error': 'GeoJSON layer provided without CRS'})
        else:
            session_redis['converted'][hashed_input] = True
            yield from app_glob['redis_conn'].set(f_name, result)
#        os.remove(filepath)
    else:
        result = json.dumps({'Error': 'Incorrect datatype'})

    return web.Response(text=result)

class R_commande(web.View):
    @asyncio.coroutine
    def get(self):
        function = self.request.match_info['function']
        params = self.request.match_info['params']
        data = dict([(_.split('=')[0], try_float(_.split('=')[1])) for _ in params.split('&')])
        commande = ''.join(
            [function,
             '(',
             ','.join(['='.join([param,param]) for param in data]),
             ')']
            ).encode()
        id_ = yield from is_known_user(
            self.request, ref=app_glob['session_map'])
        data = json.dumps(data).encode()
        content = yield from R_client_fuw_async(
            url_client, commande, data, app_glob['async_ctx'], id_)
        return web.Response(text=content.decode())

    def post(self):
        function = self.request.match_info['function']
        params = yield from self.request.post()
        commande = ''.join([
            function,
            '(',
            ','.join(['='.join([param,param]) for param in params]),
            ')']).encode()
        data = {k:try_float(v) for k,v in params.items()}
        id_ = yield from is_known_user(self.request, ref=app_glob['session_map'])
        data = json.dumps(data).encode()
        content = yield from R_client_fuw_async(
            url_client, commande, data, app_glob['async_ctx'], id_)
        return web.Response(text=content.decode())

@asyncio.coroutine
@aiohttp_jinja2.template('modules/test_interface.html')
def handle_app_functionality(request):
    return {"func" : request.match_info['function']}

@asyncio.coroutine
def links_map(posted_data, session_redis, id_, user_id):
    posted_data = json.loads(posted_data.get("json"))
    filenames = {"src_layer" : ''.join(['/tmp/', get_name(), '.geojson']),
                 "result": None}
    savefile(filenames['src_layer'], topojson_to_geojson(posted_data['topojson']).encode())
    commande = b'getLinkLayer_json(layer_json_path, csv_table, i, j, fij, join_field)'
    data = json.dumps({
        "layer_json_path": filenames['src_layer'],
        "csv_table": posted_data['csv_table'],
        "i": posted_data["field_i"],
        "j": posted_data["field_j"],
        "fij": posted_data["field_fij"],
        "join_field": posted_data["join_field"]
        }).encode()

    content = yield from R_client_fuw_async(
        url_client, commande, data, app_glob['async_ctx'], id_)
    content = json.loads(content.decode())
#    print(content)
    if "additional_infos" in content and content["additional_infos"] and len(content["additional_infos"]) > 0:
        print("Additionnal infos:\n", content["additional_infos"])
    tmp_part = get_name()
    filenames['result'] = ''.join(["/tmp/", tmp_part, ".geojson"])
    savefile(filenames['result'], json.dumps(content['geojson']).encode())
    res = geojson_to_topojson(filenames['result'])
    return res.replace(tmp_part, "Links_")

@asyncio.coroutine
def carto_gridded(posted_data, session_redis, id_, user_id):
    posted_data = json.loads(posted_data.get("json"))
    filenames = {"src_layer" : ''.join(['/tmp/', get_name(), '.geojson']),
                 "result": None}
    savefile(filenames['src_layer'], topojson_to_geojson(posted_data['topojson']).encode())
    commande = b'make_gridded_map(layer_json_path, var_name, cellsize)'
    data = json.dumps({
        "layer_json_path": filenames['src_layer'],
        "var_name": posted_data["var_name"],
        "cellsize": posted_data["cellsize"]
        }).encode()

    content = yield from R_client_fuw_async(
        url_client, commande, data, app_glob['async_ctx'], id_)
    content = json.loads(content.decode())
    if "additional_infos" in content and content["additional_infos"] and len(content["additional_infos"]) > 0:
        print("Additionnal infos:\n", content["additional_infos"])

    tmp_part = get_name()
    filenames['result'] = ''.join(["/tmp/", tmp_part, ".geojson"])
    savefile(filenames['result'], json.dumps(content['geojson']).encode())
    res = geojson_to_topojson(filenames['result'])
    new_name = '_'.join(['Gridded', posted_data["cellsize"], posted_data['var_name']])

    return '|||'.join([new_name, res.replace(tmp_part, new_name)])

@asyncio.coroutine
def call_mta(posted_data, session_redis, id_, user_id):
    posted_data = json.loads(posted_data.get("json"))
    return ''

@asyncio.coroutine
def call_stewart(posted_data, session_redis, id_, user_id):
    posted_data = json.loads(posted_data.get("json"))

    if posted_data['mask_layer']:
        f_name = '_'.join([user_id, posted_data['mask_layer']])
        result_mask = yield from app_glob['redis_conn'].get(f_name)
        print("Found it")
    filenames = {'point_layer': ''.join(['/tmp/', get_name(), '.geojson']),
                 'mask_layer': ''.join(['/tmp/', get_name(), '.geojson']) if posted_data['mask_layer'] != "" else None,
                 'result': None}
    savefile(filenames['point_layer'], json.dumps(topo_to_geo(posted_data['topojson'])).encode())
    if filenames['mask_layer']:
        savefile(filenames['mask_layer'], json.dumps(topo_to_geo(result_mask.decode())).encode())

    commande = (b'stewart_to_json(knownpts_json, var_name, typefct, span, '
                b'beta, resolution, mask_json)')
    data = json.dumps({
        'knownpts_json': filenames['point_layer'],
        'var_name': posted_data['var_name'],
        'typefct': posted_data['typefct'].lower(),
        'span': float(posted_data['span']),
        'beta': float(posted_data['beta']),
        'resolution': float(posted_data['resolution']),
        'mask_json': filenames['mask_layer']
        }).encode()
#    print(data)
    content = yield from R_client_fuw_async(
        url_client, commande, data, app_glob['async_ctx'], id_)
    content = json.loads(content.decode())
    if "additional_infos" in content and content["additional_infos"] and len(content["additional_infos"]) > 0:
        print("Additionnal infos:\n", content["additional_infos"])
    tmp_part = get_name()
    filenames['result'] = ''.join(["/tmp/", tmp_part, ".geojson"])

    savefile(filenames['result'], json.dumps(content['geojson']).encode())
    res = geojson_to_topojson(filenames['result'])
    new_name = '_'.join(['StewartPot', posted_data['var_name']])

    return '|||'.join([json.dumps(content['breaks']), new_name, res.replace(tmp_part, new_name)])


@asyncio.coroutine
def R_compute(request):
    function = request.match_info['function']
    if function not in app_glob['R_function']:
        return web.Response(text=json.dumps({"Error": "Wrong function requested"}))
    else: 
        posted_data = yield from request.post()
        session_redis = yield from get_session(request)
        user_id = get_user_id(session_redis)
        id_ = yield from is_known_user(
            request, ref=app_glob['session_map'])
        func = app_glob['R_function'][function]
        data_response = yield from func(posted_data, session_redis, id_, user_id)
        return web.Response(text=data_response)
#    posted_data = json.loads(posted_data.get("json"))
#    if not 'app_user' in session_redis:
#        print('this is not good')
#    else:
#        user_id = session_redis['app_user']
#
#    if posted_data['mask_layer']:
#        f_name = '_'.join([user_id, posted_data['mask_layer']])
#        result_mask = yield from app_glob['redis_conn'].get(f_name)
#        print("Found it")
#    filenames = {'point_layer': ''.join(['/tmp/', get_name(), '.geojson']),
#                 'mask_layer': ''.join(['/tmp/', get_name(), '.geojson']) if posted_data['mask_layer'] != "" else None,
#                 'result': None}
#    savefile(filenames['point_layer'], json.dumps(topo_to_geo(posted_data['topojson'])).encode())
#    if filenames['mask_layer']:
#        savefile(filenames['mask_layer'], json.dumps(topo_to_geo(result_mask.decode())).encode())
#
#    commande = (b'stewart_to_json(knownpts_json, var_name, typefct, span, '
#                b'beta, resolution, mask_json)')
#    data = json.dumps({
#        'knownpts_json': filenames['point_layer'],
#        'var_name': posted_data['var_name'],
#        'typefct': posted_data['typefct'].lower(),
#        'span': float(posted_data['span']),
#        'beta': float(posted_data['beta']),
#        'resolution': float(posted_data['resolution']),
#        'mask_json': filenames['mask_layer']
#        }).encode()
##    print(data)
#    id_ = yield from is_known_user(
#        request, ref=app_glob['session_map'])
#    print(id_)
#    content = yield from R_client_fuw_async(
#        url_client, commande, data, app_glob['async_ctx'], id_)
#    content = json.loads(content.decode())
#    print(content)
#    tmp_part = get_name()
#    filenames['result'] = ''.join(["/tmp/", tmp_part, ".geojson"])
#    print(content['breaks'], filenames['result'])
#    savefile(filenames['result'], json.dumps(content['geojson']).encode())
#    res = geojson_to_topojson(filenames['result'])
#    new_name = '_'.join(['StewartPot', posted_data['var_name']])
#    print('|||'.join([str(content['breaks']), new_name, res.replace(tmp_part, new_name)]))

@asyncio.coroutine
def init(loop, port=9999):
    redis_cookie = yield from aioredis.create_pool(('localhost', 6379), db=0, maxsize=500)
    redis_conn = yield from aioredis.create_reconnecting_redis(('localhost', 6379), db=1)
    storage = redis_storage.RedisStorage(redis_cookie)
    app = web.Application(middlewares=[session_middleware(storage)])
#    aiohttp_debugtoolbar.setup(app)
    aiohttp_jinja2.setup(app, loader=jinja2.FileSystemLoader('templates'))
    app.router.add_route('GET', '/', handler)
    app.router.add_route('GET', '/index', handler)
    app.router.add_route('GET', '/modules/{function}', handle_app_functionality)
    app.router.add_route('GET', '/R/{function}/{params}', R_commande)
    app.router.add_route('POST', '/R/{function}', R_commande)
    app.router.add_route('POST', '/R_compute/{function}', R_compute)
    app.router.add_route('POST', '/convert_to_topojson', convert)
    app.router.add_route('POST', '/cache_topojson', cache_input_topojson)
    app.router.add_route('POST', '/save_user_pref', user_pref)
    app.router.add_static('/foo/', path='templates/modules', name='modules')
    app.router.add_static('/static/', path='static', name='static')
    app.router.add_static('/database/', path='../database', name='database')

    srv = yield from loop.create_server(
        app.make_handler(), '0.0.0.0', port)
    return srv, redis_conn

if __name__ == '__main__':
    if not os.path.isdir('/tmp/feeds'):
        try:
            os.mkdir('/tmp/feeds')
        except Exception as err:
            print(err)
            sys.exit()

    if len(sys.argv) == 2:
        port = int(sys.argv[1])
        nb_r_workers = '2'
    elif len(sys.argv) == 3:
        port = int(sys.argv[1])
        nb_r_workers = sys.argv[2]
        if not nb_r_workers.isnumeric():
            sys.exit()
    else:
        port = 9999
        nb_r_workers = '2'

    # The mutable mapping provided by web.Application will be used to store (safely ?)
    # some global variables :
    # Todo : create only one web.Application object instead of app + app_glob
    app_glob = web.Application()
    if not nb_r_workers == '0':
        # To be set to '0' when launching other instance of the noname app
        # as they all can use the same worker queue
        app_glob['broker'] = Popen([
            sys.executable,'r_py/rclient_load_balance_auto_scale.py', nb_r_workers
            ])

    # In order to get an async zmq context object for the clients without using the zmq event loop:
    zmq.asyncio.install()
    app_glob['async_ctx'] = zmq.asyncio.Context(2)
    app_glob['UPLOAD_FOLDER'] = 'tmp/users_uploads'
    path = os.path.dirname(os.path.realpath(__file__))
    app_glob['app_real_path'] = path[:-path[::-1].find(os.path.sep)-1]
    app_glob['session_map'] = {}
    app_glob['app_users'] = set()
    loop = asyncio.get_event_loop()
    srv, redis_conn = loop.run_until_complete(init(loop, port))
    app_glob['redis_conn'] = redis_conn
    app_glob['R_function'] = {
        "stewart": call_stewart, "gridded": carto_gridded,
        "links": links_map, "MTA", call_mta
        }
    print(pp, 'serving on', srv.sockets[0].getsockname())
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass