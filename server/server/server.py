from os import getenv, path, mkdir, sys, unlink, listdir, stat
# workaround to allow flask to find modules
CUR_DIR = path.dirname(path.abspath(__file__))
sys.path.append(path.dirname(CUR_DIR+"/"))
from flask import Flask, Response, request, cli, g, send_file, send_from_directory
from passlib.hash import hex_sha256
from time import time
import sqlalchemy
from sqlalchemy.sql import text
import datetime
import shutil
from operator import itemgetter
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_httpauth import HTTPBasicAuth
from db import *
from response import ResponseObject as JSONResponse

# NOTES:
# flask g is for storing data during requests like a temp global dictionary

# extensions are lowercase
DOC_EXT   = ['txt','rtf','odf','ods','doc','docx','xls','xlsx']
IMG_EXT   = ['png','jpg','jpe','jpeg','gif','svg','bmp']
SOUND_EXT = ['weba','wav','opus','ogg','mp3','flac','aac']
VIDEO_EXT = ['webm','opgg','mp4']
ALLOWED_FILE_EXT = set(DOC_EXT+IMG_EXT+SOUND_EXT+VIDEO_EXT)

app = Flask(__name__)
CORS(app)
auth = HTTPBasicAuth()
admin_auth = HTTPBasicAuth()
ERR_IN_CREATE = False
FIX_ERR_IN_CREATE = True

def configure_app():
  configs = {
    'production': 'config.ProductionCfg',
    'dev': 'config.DevCfg',
    'test': 'config.TestCfg',
    'default': 'config.DevCfg'
  }
  cfg_name = getenv('SERVER_CFG') or 'default'
  app.config.from_object(configs[cfg_name])

  if not path.exists(app.config['UPLOAD_DIR']):
    mkdir(app.config['UPLOAD_DIR'])

  db.init_app(app)
  create_db()

def create_db():
  global ERR_IN_CREATE
  with app.app_context():
    db.create_all()
    try:
      admin = Admin.query.filter_by(username='admin').first()
      if not admin:
        admin = Admin(username='admin',password='test')
        db.session.add(admin)
        db.session.commit()
    except sqlalchemy.exc.InternalError as err:
      isFatal = not FIX_ERR_IN_CREATE or ERR_IN_CREATE
      if not FIX_ERR_IN_CREATE:
        print("Will not try to fix")
      elif ERR_IN_CREATE:
        print("Could not be fixed")
      if isFatal:
        print("Fatal, exiting")
        exit
      # print(err._sql_message()) TMI message
      print("Error:",err._message())
      print("Trying to fix, recreating database")
      ERR_IN_CREATE = True
      recreate_db()

def clear_file_store():
  folder = app.config['UPLOAD_DIR']
  for file in listdir(folder):
    file_path = path.join(folder, file)
    try:
      if path.isfile(file_path):
        unlink(file_path)
    except Exception as e:
      print(e)

def clear_db():
  with app.app_context():
    print('session commit')
    db.session.commit()
    # TODO: setting FOREIGN_KEY_CHECKS doesn't always seem to work, maybe because it is per session and mysqlAlchemy is switching out sessions
    result = db.engine.execute('show variables where variable_name="FOREIGN_KEY_CHECKS"')
    data = get_query_data(result)[0]
    message = "Foreign checks are off for current session, drop statement may succeed" if data['Value'] is 'ON' else "Foreign checks are on"
    print(message,data)
    print('Turning foreign checks off')
    db.engine.execute('set FOREIGN_KEY_CHECKS=0')
    result = db.engine.execute('show variables where variable_name="FOREIGN_KEY_CHECKS"')
    data = get_query_data(result)[0]
    message = "Successfully turned off, drop statement should succeed" if data['Value'] is 'ON' else "Failed to turn off, drop statement may error"
    print(message,data)
    print('Trying to drop all tables')
    db.drop_all()
    clear_file_store()
    db.engine.execute('set FOREIGN_KEY_CHECKS=1')

def recreate_db():
  global ERR_IN_CREATE
  clear_db()
  create_db()
  if ERR_IN_CREATE:
    print("Successfully fixed error")

@app.route('/')
def index():
  return "OK"

@auth.verify_password
def verify_password(username,password):
  user = User.query.filter_by(username=username).first()
  if not user or not user.verify_password(password):
    return False
  g.user = user
  return True

@admin_auth.verify_password
def verify_admin_password(username,password):
  admin = Admin.query.filter_by(username=username).first()
  if not admin or not admin.verify_password(password):
    return False
  g.admin = admin
  return True

@app.route('/db',methods=['DELETE'])
@admin_auth.login_required
def delete_db():
  if g.admin.username != "admin":
    return JSONResponse("Unauthorized",401,True).end()
  recreate_db()
  return "OK"

@app.route('/users',methods=['POST'])
def add_user():
  # shorten name for easier access
  req = request.json
  # get json data
  email    = None if req is None else req.get('email',None)
  username = None if req is None else req.get('username',None)
  password = None if req is None else req.get('password',None)
  channel_description = '' if req is None else req.get('channel_description','')
  # trivial validate not empty
  missing = []
  if email is None:
    missing.append('email')
  if username is None:
    missing.append('username')
  if password is None:
    missing.append('password')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # make sure username and email are unique
  result = db.engine.execute(text("SELECT user_id FROM User WHERE username=:uname"), uname=username)
  unameUniq = len(get_query_data(result)) == 0
  result = db.engine.execute(text("SELECT user_id FROM User WHERE email=:email"), email=email)
  emailUniq = len(get_query_data(result)) == 0
  # unameUniq = len(User.query.filter_by(username=username).all()) == 0
  # emailUniq = len(User.query.filter_by(email=email).all()) == 0

  notUniq = []
  if not unameUniq:
    notUniq.append('username')
  if not emailUniq:
    notUniq.append('email')
  if notUniq:
    return JSONResponse({'not unique':notUniq},400,isError=True).end()

  # valid parameters, create and return it
  result = db.engine.execute(text("INSERT INTO User (username,email,password_hash,channel_description) VALUES(:uname,:email,:password_hash,:channel_description)"),uname=username,email=email,password_hash=hash_password(password),channel_description=channel_description)
  # newUser = User(email=email,username=username,password=password)
  # db.session.add(newUser)
  # db.session.commit()
  result = db.engine.execute('SELECT user_id, username, email, channel_description FROM User WHERE user_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  return JSONResponse(data[0]).end()

@app.route('/users/<user_id>',methods=['DELETE'])
@auth.login_required
def remove_user(user_id):
  if g.user.user_id != int(user_id):
    return JSONResponse("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT user_id,email,username,password_hash,channel_description FROM User WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    #Unlinks neccessary relationships
    user_favorites_list=db.session.query(user_favorites).filter(user_id==user_id).all()
    for user_favorite in user_favorites_list:
      result = db.engine.execute('DELETE FROM user_favorites WHERE user_id={ID}'.format(ID=user_id))
    result = db.engine.execute('DELETE FROM User WHERE user_id={ID}'.format(ID=user_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()

  user = User.query.get(user_id)
  if user:
    db.session.delete(user)
    db.session.commit()
    return JSONResponse(user.to_json()).end()
  return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()

# NOTE: unordered dict
def get_query_data(resultProxy):
  ret = []
  for rowProxy in resultProxy:
    ret.append(dict(rowProxy.items()))
  return ret

# data must be a list of the same dict type
# options = {
#   filters: [{
#     any: (bool) found in any column (exact or contains)
#     column: string,
#     value:  string,
#     cmp: min, max, exact, contains, TODO: word_contains, fuzzy?
#   }],
#   sorters: [{
#     column: string,
#     descending: bool
#   }],
#   bounds: {
#     start: num,
#     limit: num,
#   }
# }
def filter_sort_paginate(data,opts):
  if len(data) == 0:
    return []

  ret = []
  filters = opts['filters']
  sorters = opts['sorters']
  bounds  = opts['bounds']

  if filters:
    for entry in data:
      for f in filters:
        keep = False
        if f.get('any', False):
          # tests if value appears in entry
          if f['cmp'] == 'exact' and f['value'] in entry.values():
            keep = True
          else:
            # if f['cmp'] == 'contains' or other value
            for value in entry.values():
              if f['value'] in str(value):
                keep = True
                break
        else:
          # specific filters
          if f['column'] in entry.keys():
            if f['cmp'] == 'exact' and f['value'] == entry[f['column']]:
              keep = True
            elif f['cmp'] == 'contains' and f['value'] in str(entry[f['column']]):
              keep = True
            elif f['cmp'] == 'min' and f.value >= entry[f['column']]:
              keep = True
            elif f['cmp'] == 'max' and f['value'] <= entry[f['column']]:
              keep = True
        # this entry matched a filter, stop checking other filters
        if keep:
          ret.append(entry)
          break
  else:
    ret = data

  if sorters:
    # sorted() handles multi sort stability (according to docs)
    for sorter in sorters:
      column = sorter['column']
      descending = sorter['descending'] in ['true','True']
      ret = sorted(ret, key=itemgetter(column), reverse=descending)

  if bounds:
    start = int(bounds['start']) if bounds['start'] else 0
    limit = int(bounds['limit']) if bounds['limit'] else len(ret)
    return ret[start:limit]
  else:
    return ret

# url args only for basic search opts
# more specific filters/options are in form data
#
# support:
# landing/home:
#   trending
#   ?type=file&daysAgo=14&sortDsc=views
#   best of 0001
#   ?type=file&upload_dateBeg=01-01-0001&upload_dateEnd=12-31-0001&sortDsc=views
# browse search (users, files, and playlists):
#   ?q=hello&sortDsc=views&start=5&limit=10
#   ?q=hello+world&tag=a&tag=b&cat=image&cat=video&sortAsc=rank&sortDsc=views&start=5&limit=3
# browse search files:
#   ?type=file&q=hello+world&tag=a&tag=b&cat=image&cat=video&sortAsc=rank&sortDsc=views&start=5&limit=3
# browse search users/channels:
#   ?type=user?q=bob+jo&sortAsc=uploads&start=0&limit=1
#   ?type=user?q=bob+jo&uploadsMin=20&subsMin=5
# user channel (files):
#   user_id=1&perms=1&tag=b&cat=image&cat=video&sortAsc=rank&sortDsc=views&start=5&limit=3
#   playlist_id=2&...
# user channel (playlist):
#   user_id=2&name=favorites...
#   user_id=2&creation_date=01-01-0001&...
# user channel (contacts):
#   user_id=2
#   user_id=2&daysAgo=14
#   user_id=2&dateBeg=01-01-0001
# user channel (subscriptions):
#   name=Best+Channel&subsMin=20
#
def get_request_opts(req):
  opts = {
    'filters': [],
    'sorters': [],
    'bounds': {
      'start': req.args.get('b',0),
      'limit': req.args.get('l',None)
    }
  }

  if req.is_json:
    if 'filters' in req.json:
      opts['filters'] = req.json['filters']
    if 'sorters' in req.json:
      opts['sorters'] = req.json['sorters']

  if 'q' in req.args:
    opts['filters'].append({
      'any': True,
      'value': req.args.get('q'),
      'cmp': 'contains'
    })

  return opts

@app.route('/users',methods=['GET'])
def get_users():
  result = db.engine.execute('SELECT user_id,email,username,channel_description FROM User')
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()
  # users = User.query
  # return JSONResponse([user.to_json() for user in users.all()]).end()

@app.route('/admin',methods=['GET'])
def get_admins():
  result = db.engine.execute('SELECT user_id,username FROM Admin')
  data = get_query_data(result)
  return JSONResponse(data).end()
  # admins = Admin.query
  # return JSONResponse([admins.to_json() for admin in admins.all()]).end()

@app.route('/users/<user_id>',methods=['GET'])
def get_user(user_id):
  result = db.engine.execute('SELECT user_id,email,username,channel_description FROM User WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()
  # user = User.query.get(user_id)
  # if user:
  #   return JSONResponse(user.to_json()).end()
  # else:
  #   return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()

@app.route('/admin/<admin_id>',methods=['GET'])
def get_admin(admin_id):
  result = db.engine.execute('SELECT admin_id,username FROM Admin WHERE admin_id={ID}'.format(ID=admin_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("admin_id {ID} not found".format(ID=admin_id),404,True).end()
  # admin = Admin.query.get(admin_id)
  # if admin:
  #   return JSONResponse(admin.to_json()).end()
  # else:
  #   return JSONResponse("admin_id {ID} not found".format(ID=admin_id),404,True).end()

@app.route('/login',methods=['POST'])
def auth_user():
  req = request.json
  if req is None:
    return JSONResponse("Unauthorized",401,True).end()
  username = req.get('username',None)
  password = req.get('password',None)

  if username is None or password is None:
    return JSONResponse("Unauthorized",401,True).end()
  user = User.query.filter_by(username=username).first()
  if not user or not user.verify_password(password):
    return JSONResponse("Unauthorized",401,True).end()
  return JSONResponse("OK").end()

def is_allowed_file(fname):
  return '.' in fname and fname.rsplit('.',1)[1].lower() in ALLOWED_FILE_EXT

@app.route('/files/upload',methods=['POST'])
@auth.login_required
def upload_file():
  user_id = g.user.user_id
  upload_date = datetime.datetime.now()

  if 'file' not in request.files:
    return JSONResponse("missing file in request",400,True).end()

  file = request.files['file']
  mimetype = file.content_type
  filename = file.filename
  if filename == '':
    return JSONResponse("filename is blank",400,True).end()
  if not is_allowed_file(filename):
    return JSONResponse("file type not allowed",400,True).end()

  title = request.form['title']
  description = request.form['description']
  permissions = request.form['permissions']
  file_type = request.form['file_type']
  # trivial validate not empty
  missing = []
  if title is None:
    missing.append('title')
  if description is None:
    missing.append('description')
  if permissions is None:
    missing.append('permissions')
  if file_type is None:
    missing.append('file_type')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # make sure title is unique
  titleUniq = len(File.query.filter_by(title=title).all()) == 0
  notUniq = []
  if not titleUniq:
    notUniq.append('title')
  if notUniq:
    return JSONResponse({'not unique':notUniq},400,isError=True).end()

  #fileEntry = File(user_id=user_id,title=title,description=description,permissions=permissions,upload_date = upload_date,views=0,upvotes=0,downvotes=0,mimetype=mimetype,file_type=file_type)
  #db.session.add(fileEntry)
  #db.session.commit()
  sql = text("""INSERT INTO File(user_id, title, description, permissions, upload_date, views, upvotes, downvotes, mimetype, file_type) VALUES(:user_id, :title, :description, :permissions, :upload_date, :views, :upvotes, :downvotes, :mimetype, :file_type)""")
  result = db.engine.execute(sql, user_id=user_id,title=title,description=description,permissions=permissions,upload_date = upload_date,views=0,upvotes=0,downvotes=0,mimetype=mimetype,file_type=file_type)
  result = db.engine.execute('SELECT file_id,user_id,title,description,permissions,upload_date,views,upvotes,downvotes,mimetype,file_type FROM File WHERE file_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)

  if data and data[0]['file_id']:
    try:
      file.save(app.config['UPLOAD_DIR']+"/"+str(data[0]['file_id']))
      return JSONResponse(data[0]).end()
    except FileNotFoundError:
      #db.session.delete(fileEntry)
      #db.session.commit()
      result = db.engine.execute('DELETE FROM File WHERE file_id={ID}'.format(ID=data[0]['file_id']))
      return JSONResponse("Could not save file",400,True).end()
  return JSONResponse("Could not add file to database",500,True).end()

@app.route('/files',methods=['GET'])
def get_files():
  result = db.engine.execute('SELECT file_id,user_id,title,description,permissions,upload_date,views,upvotes,downvotes,mimetype,file_type FROM File')
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@app.route('/files/<file_id>',methods=['GET'])
def get_file(file_id):
  result = db.engine.execute('SELECT file_id,user_id,title,description,permissions,upload_date,views,upvotes,downvotes,mimetype,file_type FROM File WHERE file_id={ID}'.format(ID=file_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("file_id {ID} not found".format(ID=file_id),404,True).end()

# TODO: check user permissions
@app.route('/files/<file_id>/g', methods=['GET'])
def get_actual_file(file_id):
  result = db.engine.execute('SELECT user_id,title,permissions,mimetype,file_type FROM File WHERE file_id={ID}'.format(ID=file_id))
  data = get_query_data(result)
  if not data:
    return JSONResponse("file_id {ID} not found".format(ID=file_id),404,True).end()
  
  file_path = path.join(app.config['UPLOAD_DIR'], str(file_id))
  if not path.isfile(file_path):
    return JSONResponse("file for {ID} not found".format(ID=file_id),404,True).end()
  
  info = data[0]
  ranges = request.headers.get('Range',None)
  if ranges:
    # FIXME: should check if ext in SOUND_EXT or ext in VIDEO_EXT
    beg, end = ranges[ranges.find('=')+1:].split('-')
    length = -1
    beg = int(beg)
    file_size = stat(file_path).st_size
    if beg >= file_size:
      return JSONResponse("Invalid range",400,isError=True).end()
    if end:
      length = int(end) + 1 - beg
    else:
      chunk_end = (int(beg) + 1000 * 1000 * 1)
      length = chunk_end if beg+chunk_end <= file_size else file_size-beg
    with open(file_path, 'rb') as f:
      f.seek(beg)
      file_chunk = f.read(length)
    res = Response(file_chunk,206,mimetype=info['mimetype'],content_type=info['mimetype'],direct_passthrough=True)
    res.headers.add('Content-Range', 'bytes {b}-{l}/{t}'.format(b=beg,l=beg+length-1,t=file_size))
    return res
  # no range header given, send entire file
  else:
    return send_file(file_path, mimetype=info['mimetype'])

def remove_file_from_store(file_id):
  folder = app.config['UPLOAD_DIR']
  file_path = path.join(folder, str(file_id))
  try:
    if path.isfile(file_path):
      unlink(file_path)
  except Exception as e:
    print(e)

@app.route('/files/<file_id>',methods=['DELETE'])
@auth.login_required
def remove_file(file_id):
  file = File.query.get(file_id)
  if g.user.user_id != int(file.user_id):
    return JSONResponse("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT file_id,user_id,title,description,permissions,upload_date,views,upvotes,downvotes,mimetype,file_type FROM File WHERE file_id={ID}'.format(ID=file_id))
  data = get_query_data(result)
  if data:
    #Unlinks neccessary relationships
    comments=Comment.query.filter_by(file_id=file_id).all()
    for comment in comments:
      result = db.engine.execute('DELETE FROM Comment WHERE comment_id={ID}'.format(ID=comment.comment_id))
    user_favorites_list=db.session.query(user_favorites).filter(file_id==file_id).all()
    for user_favorite in user_favorites_list:
      result = db.engine.execute('DELETE FROM user_favorites WHERE file_id={ID}'.format(ID=file_id))
    playlist_files_list=db.session.query(playlist_files).filter(file_id==file_id).all()
    for playlist_file in playlist_files_list:
      result = db.engine.execute('DELETE FROM playlist_files WHERE file_id={ID}'.format(ID=file_id))
    files_categories_list=db.session.query(files_categories).filter(file_id==file_id).all()
    for file_category in files_categories_list:
      result = db.engine.execute('DELETE FROM files_categories WHERE file_id={ID}'.format(ID=file_id))
    files_keywords_list=db.session.query(files_keywords).filter(file_id==file_id).all()
    for file_keyword in files_keywords_list:
      result = db.engine.execute('DELETE FROM files_keywords WHERE file_id={ID}'.format(ID=file_id))

    result = db.engine.execute('DELETE FROM File WHERE file_id={ID}'.format(ID=file_id))
    remove_file_from_store(file_id)
    return JSONResponse(data[0]).end()
  return JSONResponse("file_id {ID} not found".format(ID=file_id),404,True).end()

  # if File:
  #   db.session.delete(file)
  #   db.session.commit()
  #   remove_file_from_store(file_id)
  #   return JSONResponse(file.to_json()).end()
  # return JSONResponse("file_id {ID} not found".format(ID=file_id),404,True).end()

@app.route('/playlists/upload',methods=['POST'])
@auth.login_required
def add_playlist():
  # shorten name for easier access
  req = request.json
  # get json data
  user_id    = None if req is None else req.get('user_id',None)
  title = None if req is None else req.get('title',None)
  description = None if req is None else req.get('description',None)
  # trivial validate not empty
  missing = []
  if user_id is None:
    missing.append('user_id')
  if title is None:
    missing.append('title')
  if description is None:
    missing.append('description')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # valid parameters, create and return it
  #newPlaylist = Playlist(user_id=user_id,title=title,description=description)
  #db.session.add(newPlaylist)
  #db.session.commit()
  sql = text("""INSERT INTO Playlist(user_id, title, description) VALUES(:user_id, :title, :description)""")
  result = db.engine.execute(sql, user_id=user_id, title=title, description=description)
  result = db.engine.execute('SELECT playlist_id,user_id,title,description FROM Playlist WHERE playlist_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("Playlist creation failed",500,True).end()

@app.route('/playlists/<playlist_id>',methods=['GET'])
def get_playlist(playlist_id):
  result = db.engine.execute('SELECT playlist_id,user_id,title,description FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

@app.route('/playlists/<playlist_id>',methods=['DELETE'])
@auth.login_required
def remove_playlist(playlist_id):
  playlist = Playlist.query.get(playlist_id)
  if g.user.user_id != int(playlist.user_id):
    return JSONResponse("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT playlist_id,user_id,title,description FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
  data = get_query_data(result)
  if data:
    #Unlinks neccessary relationships
    playlist_files_list=db.session.query(playlist_files).filter(playlist_id==playlist_id).all()
    for playlist_file in playlist_files_list:
      result = db.engine.execute('DELETE FROM playlist_files WHERE playlist_id={ID}'.format(ID=playlist_id))
    result = db.engine.execute('DELETE FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

  if Playlist:
    db.session.delete(playlist)
    db.session.commit()
    return JSONResponse(playlist.to_json()).end()
  return JSONResponse("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

@app.route('/categories/upload',methods=['POST'])
@admin_auth.login_required
def add_category():
  # shorten name for easier access
  req = request.json
  # get json data
  category = None if req is None else req.get('category',None)
  # trivial validate not empty
  missing = []
  if category is None:
    missing.append('category')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # valid parameters, create and return it
  #newCategory= Category(category=category)
  #db.session.add(newCategory)
  #db.session.commit()
  sql = text("""INSERT INTO Category(category) VALUES(:category)""")
  result = db.engine.execute(sql, category=category)
  result = db.engine.execute('SELECT category_id,category FROM Category WHERE category_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("Category creation failed",500,True).end()

@app.route('/categories/<category_id>',methods=['GET'])
def get_category(category_id):
  result = db.engine.execute('SELECT category_id,category FROM Category WHERE category_id={ID}'.format(ID=category_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("category_id {ID} not found".format(ID=category_id),404,True).end()

@app.route('/categories/<category_id>',methods=['DELETE'])
@admin_auth.login_required
def remove_category(category_id):
  result = db.engine.execute('SELECT category_id,category FROM Category WHERE category_id={ID}'.format(ID=category_id))
  data = get_query_data(result)
  if data:
    #Unlinks neccessary relationships
    files_categories_list=db.session.query(files_categories).filter(category_id==category_id).all()
    for file_category in files_categories_list:
      result = db.engine.execute('DELETE FROM files_categories WHERE category_id={ID}'.format(ID=category_id))
    result = db.engine.execute('DELETE FROM Category WHERE category_id={ID}'.format(ID=category_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("category_id {ID} not found".format(ID=category_id),404,True).end()

  category = Category.query.get(category_id)
  if Category:
    db.session.delete(category)
    db.session.commit()
    return JSONResponse(category.to_json()).end()
  return JSONResponse("category_id {ID} not found".format(ID=category_id),404,True).end()

@app.route('/keywords/upload',methods=['POST'])
@admin_auth.login_required
def add_keyword():
  # shorten name for easier access
  req = request.json
  # get json data
  keyword = None if req is None else req.get('keyword',None)
  # trivial validate not empty
  missing = []
  if keyword is None:
    missing.append('keyword')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # valid parameters, create and return it
  #newKeyword= Keyword(keyword=keyword)
  #db.session.add(newKeyword)
  #db.session.commit()
  sql = text("""INSERT INTO Keyword(keyword) VALUES(:keyword)""")
  result = db.engine.execute(sql, keyword=keyword)
  result = db.engine.execute('SELECT keyword_id,keyword FROM Keyword WHERE keyword_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("Keyword creation failed",500,True).end()

@app.route('/keywords/<keyword_id>',methods=['GET'])
def get_keyword(keyword_id):
  result = db.engine.execute('SELECT keyword_id,keyword FROM Keyword WHERE keyword_id={ID}'.format(ID=keyword_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("keyword_id {ID} not found".format(ID=keyword_id),404,True).end()

@app.route('/keywords/<keyword_id>',methods=['DELETE'])
@admin_auth.login_required
def remove_keyword(keyword_id):
  result = db.engine.execute('SELECT keyword_id,keyword FROM Keyword WHERE keyword_id={ID}'.format(ID=keyword_id))
  data = get_query_data(result)
  if data:
    #Unlinks neccessary relationships
    files_keywords_list=db.session.query(files_keywords).filter(keyword_id==keyword_id).all()
    for file_keyword in files_keywords_list:
      result = db.engine.execute('DELETE FROM files_keywords WHERE keyword_id={ID}'.format(ID=keyword_id))
    result = db.engine.execute('DELETE FROM Keyword WHERE keyword_id={ID}'.format(ID=keyword_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("keyword_id {ID} not found".format(ID=keyword_id),404,True).end()

  keyword = Keyword.query.get(keyword_id)
  if Keyword:
    db.session.delete(keyword)
    db.session.commit()
    return JSONResponse(keyword.to_json()).end()
  return JSONResponse("keyword_id {ID} not found".format(ID=keyword_id),404,True).end()

@app.route('/users/add_contact',methods=['LINK'])
@auth.login_required
def add_contact():
  # shorten name for easier access
  req = request.json
  # get json data
  contacting_id = None if req is None else req.get('contacting_id',None)
  contacted_id = None if req is None else req.get('contacted_id',None)
  # trivial validate not empty
  missing = []
  if contacting_id is None:
    missing.append('contacting_id')
  if contacted_id is None:
    missing.append('contacted_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  contacting_user=User.query.get(contacting_id)
  contacted_user=User.query.get(contacted_id)

  if contacted_user.is_blocked(contacting_user):
    return JSONResponse("Contacting user is blocked",401,True).end()

  if not contacting_user.is_contact(contacted_user):
    #contacting_user.contacted.append(contacted_user)
    result = db.engine.execute("INSERT INTO contacts VALUES({}, {})".format(contacting_id, contacted_id))
    #db.session.commit()
    return JSONResponse("Contact created",200,False).end()
  return JSONResponse("Contact already exists",404,True).end()

@app.route('/users/remove_contact',methods=['UNLINK'])
@auth.login_required
def remove_contact():
  # shorten name for easier access
  req = request.json
  # get json data
  contact_removing_id = None if req is None else req.get('contact_removing_id',None)
  contact_removed_id = None if req is None else req.get('contact_removed_id',None)
  # trivial validate not empty
  missing = []
  if contact_removing_id is None:
    missing.append('contact_removing_id')
  if contact_removed_id is None:
    missing.append('contact_removed_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  contact_removing=User.query.get(contact_removing_id)
  contact_removed=User.query.get(contact_removed_id)
  if contact_removing.is_contact(contact_removed):
    #Unlinks neccessary relationships
    sent_messages = Message.query.filter_by(contacting_id=contact_removing_id, contacted_id=contact_removed_id).all()
    received_messages = Message.query.filter_by(contacting_id=contact_removed_id, contacted_id=contact_removing_id).all()
    for message in sent_messages:
      result = db.engine.execute('DELETE FROM Message WHERE message_id={ID}'.format(ID=message.message_id))
    for message in received_messages:
      result = db.engine.execute('DELETE FROM Message WHERE message_id={ID}'.format(ID=message.message_id))

    #contact_removing.contacted.remove(contact_removed)
    result = db.engine.execute("DELETE FROM contacts WHERE contacting_id = {} AND contacted_id = {}".format(contact_removing_id, contact_removed_id))
    #db.session.commit()
    return JSONResponse("Contact removed",200,False).end()
  return JSONResponse("No contact exists",404,True).end()

@app.route('/messages/upload',methods=['POST'])
@auth.login_required
def add_message():
  message_date  = datetime.datetime.now()

  # shorten name for easier access
  req = request.json
  # get json data
  message = None if req is None else req.get('message',None)
  contacting_id = None if req is None else req.get('contacting_id',None)
  contacted_id = None if req is None else req.get('contacted_id',None)
  # trivial validate not empty
  missing = []
  if message is None:
    missing.append('message')
  if contacting_id is None:
    missing.append('contacting_id')
  if contacted_id is None:
    missing.append('contacted_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  contacting_user = User.query.get(contacting_id)
  contacted_user = User.query.get(contacted_id)

  if contacted_user.is_blocked(contacting_user):
    return JSONResponse("Contacting user is blocked",401,True).end()

  if not contacting_user.is_contact(contacted_user):
    return JSONResponse("{ID} is not a contact to contacting user".format(ID=contacted_id),404,True).end()

  # valid parameters, create and return it
  #newMessage=Message(contacting_id=contacting_id, contacted_id=contacted_id, message=message, message_date=message_date)
  #db.session.add(newMessage)
  #db.session.commit()
  sql = text("""INSERT INTO Message(contacting_id, contacted_id, message) VALUES(:contacting_id, :contacted_id, :message)""")
  result = db.engine.execute(sql, contacting_id=contacting_id, contacted_id=contacted_id, message=message)
  result = db.engine.execute('SELECT message_id,contacting_id,contacted_id,message,message_date FROM Message WHERE message_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("Message creation failed",500,True).end()

@app.route('/users/subscribe',methods=['LINK'])
@auth.login_required
def subscribe():
  # shorten name for easier access
  req = request.json
  # get json data
  subscribing_id = None if req is None else req.get('subscribing_id',None)
  subscribed_id = None if req is None else req.get('subscribed_id',None)
  # trivial validate not empty
  missing = []
  if subscribing_id is None:
    missing.append('subscribing_id')
  if subscribed_id is None:
    missing.append('subscribed_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  subscribing_user=User.query.get(subscribing_id)
  subscribed_user=User.query.get(subscribed_id)

  if subscribed_user.is_blocked(subscribing_user):
    return JSONResponse("Subscribing user is blocked",401,True).end()

  if not subscribing_user.is_subscriber(subscribed_user):
    #subscribing_user.subscribed.append(subscribed_user)
    result = db.engine.execute("INSERT INTO subscribers VALUES({}, {})".format(subscribing_id, subscribed_id))
    #db.session.commit()
    return JSONResponse("Subscription created",200,False).end()
  return JSONResponse("Subscription already exists",404,True).end()

@app.route('/users/unsubscribe',methods=['UNLINK'])
@auth.login_required
def unsubscribe():
  # shorten name for easier access
  req = request.json
  # get json data
  unsubscribing_id = None if req is None else req.get('unsubscribing_id',None)
  unsubscribed_id = None if req is None else req.get('unsubscribed_id',None)
  # trivial validate not empty
  missing = []
  if unsubscribing_id is None:
    missing.append('unsubscribing_id')
  if unsubscribed_id is None:
    missing.append('unsubscribed_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  unsubscribing_user=User.query.get(unsubscribing_id)
  unsubscribed_user=User.query.get(unsubscribed_id)
  if unsubscribing_user.is_subscriber(unsubscribed_user):
    #unsubscribing_user.subscribed.remove(unsubscribed_user)
    result = db.engine.execute("DELETE FROM subscribers WHERE subscribing_id = {} AND subscribed_id = {}".format(unsubscribing_id, unsubscribed_id))
    #db.session.commit()
    return JSONResponse("Subscription removed",200,False).end()
  return JSONResponse("No subscription exists",404,True).end()

@app.route('/users/friend',methods=['LINK'])
@auth.login_required
def friend():
  # shorten name for easier access
  req = request.json
  # get json data
  friending_id = None if req is None else req.get('friending_id',None)
  friended_id = None if req is None else req.get('friended_id',None)
  # trivial validate not empty
  missing = []
  if friending_id is None:
    missing.append('friending_id')
  if friended_id is None:
    missing.append('friended_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  friending_user=User.query.get(friending_id)
  friended_user=User.query.get(friended_id)

  if friended_user.is_blocked(friending_user):
    return JSONResponse("Friending user is blocked",401,True).end()

  if not friending_user.is_friend(friended_user):
    #friending_user.friended.append(friended_user)
    result = db.engine.execute("INSERT INTO friends VALUES({}, {})".format(friending_id, friended_id))
    #db.session.commit()
    return JSONResponse("Friendship created",200,False).end()
  return JSONResponse("Friendship already exists",404,True).end()

@app.route('/users/unfriend',methods=['UNLINK'])
@auth.login_required
def unfriend():
  # shorten name for easier access
  req = request.json
  # get json data
  unfriending_id = None if req is None else req.get('unfriending_id',None)
  unfriended_id = None if req is None else req.get('unfriended_id',None)
  # trivial validate not empty
  missing = []
  if unfriending_id is None:
    missing.append('unfriending_id')
  if unfriended_id is None:
    missing.append('unfriended_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  unfriending_user=User.query.get(unfriending_id)
  unfriended_user=User.query.get(unfriended_id)
  if unfriending_user.is_friend(unfriended_user):
    #unfriending_user.friended.remove(unfriended_user)
    result = db.engine.execute("DELETE FROM friends WHERE friending_id = {} AND friended_id = {}".format(unfriending_id, unfriended_id))
    #db.session.commit()
    return JSONResponse("Friendship removed",200,False).end()
  return JSONResponse("No friendship exists",404,True).end()

@app.route('/users/block',methods=['LINK'])
@auth.login_required
def block():
  # shorten name for easier access
  req = request.json
  # get json data
  blocking_id = None if req is None else req.get('blocking_id',None)
  blocked_id = None if req is None else req.get('blocked_id',None)
  # trivial validate not empty
  missing = []
  if blocking_id is None:
    missing.append('blocking_id')
  if blocked_id is None:
    missing.append('blocked_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  blocking_user=User.query.get(blocking_id)
  blocked_user=User.query.get(blocked_id)
  if not blocking_user.is_blocked(blocked_user):
    #blocking_user.blocked.append(blocked_user)
    result = db.engine.execute("INSERT INTO blocks VALUES({}, {})".format(blocking_id, blocked_id))
    #db.session.commit()
    return JSONResponse("Blocking created",200,False).end()
  return JSONResponse("Blocking already exists",404,True).end()

@app.route('/users/unblock',methods=['UNLINK'])
@auth.login_required
def unblock():
  # shorten name for easier access
  req = request.json
  # get json data
  unblocking_id = None if req is None else req.get('unblocking_id',None)
  unblocked_id = None if req is None else req.get('unblocked_id',None)
  # trivial validate not empty
  missing = []
  if unblocking_id is None:
    missing.append('unblocking_id')
  if unblocked_id is None:
    missing.append('unblocked_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  unblocking_user=User.query.get(unblocking_id)
  unblocked_user=User.query.get(unblocked_id)
  if unblocking_user.is_blocked(unblocked_user):
    #unblocking_user.blocked.remove(unblocked_user)
    result = db.engine.execute("DELETE FROM blocks WHERE blocking_id = {} AND blocked_id = {}".format(unblocking_id, unblocked_id))
    #db.session.commit()
    return JSONResponse("Blocking removed",200,False).end()
  return JSONResponse("No blocking exists",404,True).end()

@app.route('/users/favorite',methods=['LINK'])
@auth.login_required
def favorite():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id = None if req is None else req.get('file_id',None)
  user_id = None if req is None else req.get('user_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')
  if user_id is None:
    missing.append('user_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  file=File.query.get(file_id)
  user=User.query.get(user_id)
  file_owner=User.query.get(file.user_id)

  if file_owner.is_blocked(user):
    return JSONResponse("Favoriting user is blocked from file owners content",401,True).end()

  if not user.is_favorite(file):
    #user.favorites.append(file)
    result = db.engine.execute("INSERT INTO user_favorites VALUES({}, {})".format(file_id, user_id))
    #db.session.commit()
    return JSONResponse("User favorite created",200,False).end()
  return JSONResponse("User favorite already exists",404,True).end()

@app.route('/users/unfavorite',methods=['UNLINK'])
@auth.login_required
def unfavorite():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id = None if req is None else req.get('file_id',None)
  user_id = None if req is None else req.get('user_id',None)
  # trivial validate not empty
  missing = []
  if user_id is None:
    missing.append('user_id')
  if file_id is None:
    missing.append('file_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  user=User.query.get(user_id)
  file=File.query.get(file_id)
  if user.is_favorite(file):
    #user.favorites.remove(file)
    result = db.engine.execute("DELETE FROM user_favorites WHERE file_id = {} AND user_id = {}".format(file_id, user_id))
    #db.session.commit()
    return JSONResponse("User favorite removed",200,False).end()
  return JSONResponse("No favorite exists",404,True).end()

@app.route('/playlists/add_file',methods=['LINK'])
@auth.login_required
def add_file_to_playlist():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id = None if req is None else req.get('file_id',None)
  playlist_id = None if req is None else req.get('playlist_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')
  if playlist_id is None:
    missing.append('playlist_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  file=File.query.get(file_id)
  playlist=Playlist.query.get(playlist_id)
  if g.user.user_id != int(playlist.user_id):
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.append(file)
  result = db.engine.execute("INSERT INTO playlist_files VALUES({}, {})".format(file_id, playlist_id))
  #db.session.commit()
  return JSONResponse("File added to playlist",200,False).end()

@app.route('/playlists/remove_file',methods=['UNLINK'])
@auth.login_required
def remove_file_from_playlist():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id = None if req is None else req.get('file_id',None)
  playlist_id = None if req is None else req.get('playlist_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')
  if playlist_id is None:
    missing.append('playlist_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  playlist=Playlist.query.get(playlist_id)
  file=File.query.get(file_id)
  if g.user.user_id != int(playlist.user_id):
    return JSONResponse("Unauthorized",401,True).end()

  if playlist.contains_file(file):
    #playlist.files.remove(file)
    result = db.engine.execute("DELETE FROM playlist_files WHERE file_id = {} AND playlist_id = {}".format(file_id, playlist_id))
    #db.session.commit()
    return JSONResponse("File removed from playlist",200,False).end()
  return JSONResponse("Playlist does not contain file",404,True).end()

@app.route('/comments/add_comment',methods=['POST'])
@auth.login_required
def add_comment():
  # shorten name for easier access
  req = request.json
  # get json data
  user_id    = None if req is None else req.get('user_id',None)
  file_id    = None if req is None else req.get('file_id',None)
  comment = None if req is None else req.get('comment',None)
  comment_date = datetime.datetime.now()

  # trivial validate not empty
  missing = []
  if user_id is None:
    missing.append('user_id')
  if file_id is None:
    missing.append('file_id')
  if comment is None:
    missing.append('comment')
  if comment_date is None:
    missing.append('comment_date')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  file=File.query.get(file_id)
  user=User.query.get(user_id)
  file_owner=User.query.get(file.user_id)

  if file_owner.is_blocked(user):
    return JSONResponse("Commenting user is blocked from file owners content",401,True).end()

  # valid parameters, create and return it
  #newComment = Comment(user_id=user_id,file_id=file_id,comment=comment,comment_date=comment_date)
  #db.session.add(newComment)
  #db.session.commit()
  sql = text("""INSERT INTO Comment(user_id, file_id, comment) VALUES(:user_id, :file_id, :comment)""")
  result = db.engine.execute(sql, user_id=user_id, file_id=file_id, comment=comment)
  result = db.engine.execute('SELECT comment_id,user_id,file_id,comment,comment_date FROM Comment WHERE comment_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("Comment creation failed",500,True).end()

@app.route('/comments/<comment_id>',methods=['GET'])
def get_comment(comment_id):
  result = db.engine.execute('SELECT comment_id,user_id,file_id,comment,comment_date FROM Comment WHERE comment_id={ID}'.format(ID=comment_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("comment_id {ID} not found".format(ID=comment_id),404,True).end()

@app.route('/comments/<comment_id>',methods=['DELETE'])
@auth.login_required
def remove_comment(comment_id):
  comment = Comment.query.get(comment_id)
  if g.user.user_id != int(comment.user_id):
    return JSONResponse("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT comment_id,user_id,file_id,comment,comment_date FROM Comment WHERE comment_id={ID}'.format(ID=comment_id))
  data = get_query_data(result)
  if data:
    result = db.engine.execute('DELETE FROM Comment WHERE comment_id={ID}'.format(ID=comment_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("comment_id {ID} not found".format(ID=comment_id),404,True).end()

  if Comment:
    db.session.delete(comment)
    db.session.commit()
    return JSONResponse(comment.to_json()).end()
  return JSONResponse("comment_id {ID} not found".format(ID=comment_id),404,True).end()

@app.route('/categories/add_to_file',methods=['LINK'])
@auth.login_required
def add_category_to_file():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id = None if req is None else req.get('file_id',None)
  category_id = None if req is None else req.get('category_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')
  if category_id is None:
    missing.append('category_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  file=File.query.get(file_id)
  category=Category.query.get(category_id)
  if g.user.user_id != int(file.user_id):
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.append(file)
  result = db.engine.execute("INSERT INTO files_categories VALUES({}, {})".format(file_id, category_id))
  #db.session.commit()
  return JSONResponse("Category added to file",200,False).end()

@app.route('/categories/remove_from_file',methods=['UNLINK'])
@auth.login_required
def remove_category_from_file():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id = None if req is None else req.get('file_id',None)
  category_id = None if req is None else req.get('category_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')
  if category_id is None:
    missing.append('category_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  category=Category.query.get(category_id)
  file=File.query.get(file_id)
  if g.user.user_id != int(file.user_id):
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.remove(file)
  result = db.engine.execute("DELETE FROM files_categories WHERE file_id = {} AND category_id = {}".format(file_id, category_id))
  #db.session.commit()
  return JSONResponse("Category removed from file",200,False).end()

@app.route('/keywords/add_to_file',methods=['LINK'])
@auth.login_required
def add_keyword_to_file():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id = None if req is None else req.get('file_id',None)
  keyword_id = None if req is None else req.get('keyword_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')
  if keyword_id is None:
    missing.append('keyword_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  file=File.query.get(file_id)
  keyword=Keyword.query.get(keyword_id)
  if g.user.user_id != int(file.user_id):
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.append(file)
  result = db.engine.execute("INSERT INTO files_keywords VALUES({}, {})".format(file_id, keyword_id))
  #db.session.commit()
  return JSONResponse("Keyword added to file",200,False).end()

@app.route('/keywords/remove_from_file',methods=['UNLINK'])
@auth.login_required
def remove_keyword_from_file():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id = None if req is None else req.get('file_id',None)
  keyword_id = None if req is None else req.get('keyword_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')
  if keyword_id is None:
    missing.append('keyword_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  keyword=Keyword.query.get(keyword_id)
  file=File.query.get(file_id)
  if g.user.user_id != int(file.user_id):
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.remove(file)
  result = db.engine.execute("DELETE FROM files_keywords WHERE file_id = {} AND keyword_id = {}".format(file_id, keyword_id))
  #db.session.commit()
  return JSONResponse("Keyword removed from file",200,False).end()

@app.after_request
def add_accept_ranges(response):
  response.headers.add('Accept-Ranges','bytes')
  return response

cli.load_dotenv()
configure_app()
# flask run ignores app.run
if __name__ == "__main__":
  if app.config['SERVE_PUBLIC']:
    app.run(host='0.0.0.0')
  else:
    app.run()
