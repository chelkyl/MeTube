from os import getenv, path, mkdir, sys, path, unlink, listdir
# workaround to allow flask to find modules
CUR_DIR = path.dirname(path.abspath(__file__))
sys.path.append(path.dirname(CUR_DIR+"/"))
from flask import Flask, request, cli, g
from passlib.hash import hex_sha256
from time import time
import sqlalchemy
import datetime
import shutil
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_httpauth import HTTPBasicAuth
from db import *
from response import ResponseObject as Response

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
    return Response("Unauthorized",401,True).end()
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
    return Response({'missing':missing},400,isError=True).end()

  # make sure username and email are unique
  unameUniq = len(User.query.filter_by(username=username).all()) == 0
  emailUniq = len(User.query.filter_by(email=email).all()) == 0
  notUniq = []
  if not unameUniq:
    notUniq.append('username')
  if not emailUniq:
    notUniq.append('email')
  if notUniq:
    return Response({'not unique':notUniq},400,isError=True).end()

  # valid parameters, create and return it
  newUser = User(email=email,username=username,password=password)
  db.session.add(newUser)
  db.session.commit()
  return Response(newUser.to_json()).end()

@app.route('/users/<user_id>',methods=['DELETE'])
@auth.login_required
def remove_user(user_id):
  if g.user.user_id != int(user_id):
    return Response("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT user_id,email,username,password_hash,channel_description FROM User WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    result = db.engine.execute('DELETE FROM User WHERE user_id={ID}'.format(ID=user_id))
    return Response(data[0]).end()
  return Response("user_id {ID} not found".format(ID=user_id),404,True).end()

  user = User.query.get(user_id)
  if user:
    db.session.delete(user)
    db.session.commit()
    return Response(user.to_json()).end()
  return Response("user_id {ID} not found".format(ID=user_id),404,True).end()

# NOTE: unordered dict
def get_query_data(resultProxy):
  ret = []
  for rowProxy in resultProxy:
    ret.append(dict(rowProxy.items()))
  return ret

# data must be a list of the same dict type
# options = {
#   search: string query,
#   sorter: {
#     column: name,
#     sortDescending: order
#   },
#   columns: [columns to select]
# }
def filter_data(data,options):
  if len(data) == 0:
    return []
  ret = []
  search = options['search']
  sorter = options['sorter']
  # do search
  if search:
    for entry in data:
      if search in entry.keys() or seach in entry.values():
        ret.append(entry)
  else:
    ret = data
  # do sorting
  if sorter:
    sortKey = sorter['column']
    isReverse = sorter['sortDescending']
    ret.sort(reverse=isReverse, key=lambda entry: entry[sortKey])
  return ret

# TODO: add call to filter_data
@app.route('/users',methods=['GET'])
def get_users():
  result = db.engine.execute('SELECT user_id,email,username,channel_description FROM User')
  data = get_query_data(result)
  return Response(data).end()
  # users = User.query
  # return Response([user.to_json() for user in users.all()]).end()

@app.route('/admin',methods=['GET'])
def get_admins():
  result = db.engine.execute('SELECT user_id,username FROM Admin')
  data = get_query_data(result)
  return Response(data).end()
  # admins = Admin.query
  # return Response([admins.to_json() for admin in admins.all()]).end()

@app.route('/users/<user_id>',methods=['GET'])
def get_user(user_id):
  result = db.engine.execute('SELECT user_id,email,username,channel_description FROM User WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    return Response(data[0]).end()
  else:
    return Response("user_id {ID} not found".format(ID=user_id),404,True).end()
  # user = User.query.get(user_id)
  # if user:
  #   return Response(user.to_json()).end()
  # else:
  #   return Response("user_id {ID} not found".format(ID=user_id),404,True).end()

@app.route('/admin/<admin_id>',methods=['GET'])
def get_admin(admin_id):
  result = db.engine.execute('SELECT admin_id,username FROM Admin WHERE admin_id={ID}'.format(ID=admin_id))
  data = get_query_data(result)
  if data:
    return Response(data[0]).end()
  else:
    return Response("admin_id {ID} not found".format(ID=admin_id),404,True).end()
  # admin = Admin.query.get(admin_id)
  # if admin:
  #   return Response(admin.to_json()).end()
  # else:
  #   return Response("admin_id {ID} not found".format(ID=admin_id),404,True).end()

@app.route('/login',methods=['POST'])
def auth_user():
  req = request.json
  if req is None:
    return Response("Unauthorized",401,True).end()
  username = req.get('username',None)
  password = req.get('password',None)

  if username is None or password is None:
    return Response("Unauthorized",401,True).end()
  user = User.query.filter_by(username=username).first()
  if not user or not user.verify_password(password):
    return Response("Unauthorized",401,True).end()
  return Response("OK").end()

def is_allowed_file(fname):
  return '.' in fname and fname.rsplit('.',1)[1].lower() in ALLOWED_FILE_EXT

@app.route('/files/upload',methods=['POST'])
@auth.login_required
def upload_file():
  userid = g.user.user_id
  now = datetime.datetime.now()
  upload_date = now.day

  if 'file' not in request.files:
    return Response("missing file in request",400,True).end()

  file = request.files['file']
  mimetype = file.content_type
  filename = file.filename
  if filename == '':
    return Response("filename is blank",400,True).end()
  if not is_allowed_file(filename):
    return Response("file type not allowed",400,True).end()

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
    return Response({'missing':missing},400,isError=True).end()

  # make sure title is unique
  titleUniq = len(File.query.filter_by(title=title).all()) == 0
  notUniq = []
  if not titleUniq:
    notUniq.append('title')
  if notUniq:
    return Response({'not unique':notUniq},400,isError=True).end()

  fileEntry = File(user_id=userid,title=title,description=description,permissions=permissions,upload_date = upload_date,views=0,upvotes=0,downvotes=0,mimetype=mimetype,file_type=file_type)
  db.session.add(fileEntry)
  db.session.commit()
  if fileEntry.file_id:
    try:
      file.save(app.config['UPLOAD_DIR']+"/"+str(fileEntry.file_id))
      return Response(fileEntry.to_json()).end()
    except FileNotFoundError:
      db.session.delete(fileEntry)
      db.session.commit()
      return Response("Could not save file",400,True).end()
  return Response("Could not add file to database",500,True).end()

@app.route('/files/<file_id>',methods=['GET'])
def get_file(file_id):
  result = db.engine.execute('SELECT file_id,user_id,title,description,permissions,upload_date,views,upvotes,downvotes,mimetype,file_type FROM File WHERE file_id={ID}'.format(ID=file_id))
  data = get_query_data(result)
  if data:
    return Response(data[0]).end()
  else:
    return Response("file_id {ID} not found".format(ID=file_id),404,True).end()

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
    return Response("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT file_id,user_id,title,description,permissions,upload_date,views,upvotes,downvotes,mimetype,file_type FROM File WHERE file_id={ID}'.format(ID=file_id))
  data = get_query_data(result)
  if data:
    result = db.engine.execute('DELETE FROM File WHERE file_id={ID}'.format(ID=file_id))
    remove_file_from_store(file_id)
    return Response(data[0]).end()
  return Response("file_id {ID} not found".format(ID=file_id),404,True).end()

  if File:
    db.session.delete(file)
    db.session.commit()
    remove_file_from_store(file_id)
    return Response(file.to_json()).end()
  return Response("file_id {ID} not found".format(ID=file_id),404,True).end()

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
    return Response({'missing':missing},400,isError=True).end()

  # valid parameters, create and return it
  newPlaylist = Playlist(user_id=user_id,title=title,description=description)
  db.session.add(newPlaylist)
  db.session.commit()
  return Response(newPlaylist.to_json()).end()

@app.route('/playlists/<playlist_id>',methods=['GET'])
def get_playlist(playlist_id):
  result = db.engine.execute('SELECT playlist_id,user_id,title,description FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
  data = get_query_data(result)
  if data:
    return Response(data[0]).end()
  else:
    return Response("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

@app.route('/playlists/<playlist_id>',methods=['DELETE'])
@auth.login_required
def remove_playlist(playlist_id):
  playlist = Playlist.query.get(playlist_id)
  if g.user.user_id != int(playlist.user_id):
    return Response("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT playlist_id,user_id,title,description FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
  data = get_query_data(result)
  if data:
    result = db.engine.execute('DELETE FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
    return Response(data[0]).end()
  return Response("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

  if Playlist:
    db.session.delete(playlist)
    db.session.commit()
    return Response(playlist.to_json()).end()
  return Response("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

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
    return Response({'missing':missing},400,isError=True).end()

  # valid parameters, create and return it
  newCategory= Category(category=category)
  db.session.add(newCategory)
  db.session.commit()
  return Response(newCategory.to_json()).end()

@app.route('/categories/<category_id>',methods=['GET'])
def get_category(category_id):
  result = db.engine.execute('SELECT category_id,category FROM Category WHERE category_id={ID}'.format(ID=category_id))
  data = get_query_data(result)
  if data:
    return Response(data[0]).end()
  else:
    return Response("category_id {ID} not found".format(ID=category_id),404,True).end()

@app.route('/categories/<category_id>',methods=['DELETE'])
@admin_auth.login_required
def remove_category(category_id):
  result = db.engine.execute('SELECT category_id,category FROM Category WHERE category_id={ID}'.format(ID=category_id))
  data = get_query_data(result)
  if data:
    result = db.engine.execute('DELETE FROM Category WHERE category_id={ID}'.format(ID=category_id))
    return Response(data[0]).end()
  return Response("category_id {ID} not found".format(ID=category_id),404,True).end()

  category = Category.query.get(category_id)
  if Category:
    db.session.delete(category)
    db.session.commit()
    return Response(category.to_json()).end()
  return Response("category_id {ID} not found".format(ID=category_id),404,True).end()

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
    return Response({'missing':missing},400,isError=True).end()

  # valid parameters, create and return it
  newKeyword= Keyword(keyword=keyword)
  db.session.add(newKeyword)
  db.session.commit()
  return Response(newKeyword.to_json()).end()

@app.route('/keywords/<keyword_id>',methods=['GET'])
def get_keyword(keyword_id):
  result = db.engine.execute('SELECT keyword_id,keyword FROM Keyword WHERE keyword_id={ID}'.format(ID=keyword_id))
  data = get_query_data(result)
  if data:
    return Response(data[0]).end()
  else:
    return Response("keyword_id {ID} not found".format(ID=keyword_id),404,True).end()

@app.route('/keywords/<keyword_id>',methods=['DELETE'])
@admin_auth.login_required
def remove_keyword(keyword_id):
  result = db.engine.execute('SELECT keyword_id,keyword FROM Keyword WHERE keyword_id={ID}'.format(ID=keyword_id))
  data = get_query_data(result)
  if data:
    result = db.engine.execute('DELETE FROM Keyword WHERE keyword_id={ID}'.format(ID=keyword_id))
    return Response(data[0]).end()
  return Response("keyword_id {ID} not found".format(ID=keyword_id),404,True).end()

  keyword = Keyword.query.get(keyword_id)
  if Keyword:
    db.session.delete(keyword)
    db.session.commit()
    return Response(keyword.to_json()).end()
  return Response("keyword_id {ID} not found".format(ID=keyword_id),404,True).end()

@app.route('/messages/upload',methods=['POST'])
@auth.login_required
def add_message():
  # shorten name for easier access
  req = request.json
  # get json data
  message = None if req is None else req.get('message',None)
  # trivial validate not empty
  missing = []
  if message is None:
    missing.append('message')

  # return error if missing any
  if missing:
    return Response({'missing':missing},400,isError=True).end()

  now = datetime.datetime.now()
  message_date = now.day

  # valid parameters, create and return it
  newMessage=Message(message=message, message_date=message_date)
  db.session.add(newMessage)
  db.session.commit()
  return Response(newMessage.to_json()).end()

cli.load_dotenv()
configure_app()
# flask run ignores app.run
if __name__ == "__main__":
  app.run()
