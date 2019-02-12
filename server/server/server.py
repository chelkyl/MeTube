from os import getenv, path, mkdir, sys
# workaround to allow flask to find modules
CUR_DIR = path.dirname(path.abspath(__file__))
sys.path.append(path.dirname(CUR_DIR+"/"))
from flask import Flask, request, cli, g
from passlib.hash import hex_sha256
from time import time
import sqlalchemy
from flask_sqlalchemy import SQLAlchemy
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
auth = HTTPBasicAuth()
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
      admin = User.query.filter_by(username='admin').first()
      if not admin:
        admin = User('admin','email','password', 'channel_description')
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

def clear_db():
  with app.app_context():
    db.session.commit()
    # db.engine.execute('set FOREIGN_KEY_CHECKS = 0')
    db.drop_all()
    # db.engine.execute('set FOREIGN_KEY_CHECKS = 1')

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

@app.route('/db',methods=['DELETE'])
@auth.login_required
def delete_db():
  if g.user.username != "admin":
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
  newUser = User(email,username,password)
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


# TODO: filter, sort, paginate
@app.route('/users',methods=['GET'])
def get_users():
  result = db.engine.execute('SELECT user_id,email,username,password_hash,channel_description FROM User')
  data = get_query_data(result)
  return Response(data).end()
  # users = User.query
  # return Response([user.to_json() for user in users.all()]).end()

@app.route('/users/<user_id>',methods=['GET'])
def get_user(user_id):
  user = User.query.get(user_id)
  if user:
    return Response(user.to_json()).end()
  else:
    return Response("user_id {ID} not found".format(ID=user_id),404,True).end()

def is_allowed_file(fname):
  return '.' in fname and fname.rsplit('.',1)[1].lower() in ALLOWED_FILE_EXT

@app.route('/files/upload',methods=['POST'])
@auth.login_required
def upload_file():
  userid = g.user.user_id

  if 'file' not in request.files:
    return Response("missing file in request",400,True).end()
  
  file = request.files['file']
  mimetype = file.content_type
  filename = file.filename
  if filename == '':
    return Response("filename is blank",400,True).end()
  if not is_allowed_file(filename):
    return Response("file type not allowed",400,True).end()

  realname = hex_sha256.hash(filename+str(time()))
  print(realname)
  fileEntry = File(userid, realname, app.config['UPLOAD_DIR'], filename, mimetype)
  db.session.add(fileEntry)
  db.session.commit()
  if fileEntry.file_id:
    try:
      file.save(fileEntry.path)
      return Response(fileEntry.to_json()).end()
    except FileNotFoundError:
      db.session.delete(fileEntry)
      db.session.commit()
      return Response("Could not save file",400,True).end()
  return Response("Could not add file to database",500,True).end()



cli.load_dotenv()
configure_app()
# flask run ignores app.run
if __name__ == "__main__":
  app.run()
