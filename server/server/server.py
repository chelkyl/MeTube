from os import getenv, path, mkdir
from flask import Flask, request, cli, g
from passlib.hash import hex_sha256
from time import time
from flask_sqlalchemy import SQLAlchemy
from response import ResponseObject as Response
from flask_httpauth import HTTPBasicAuth

# flask g is for storing data during requests like a temp global dictionary

ALLOWED_FILE_EXT = set(['png','jpg','jpeg','gif','txt'])

app = Flask(__name__)
auth = HTTPBasicAuth()

def configure_app(is_flask=False):
  prefix = 'server.config.' if is_flask else 'config.'
  configs = {
    'production': prefix+'ProductionCfg',
    'dev': prefix+'DevCfg',
    'test': prefix+'TestCfg',
    'default': prefix+'DevCfg'
  }
  cfg_name = getenv('SERVER_CFG') or 'default'
  app.config.from_object(configs[cfg_name])

  if not path.exists(app.config['UPLOAD_DIR']):
    mkdir(app.config['UPLOAD_DIR'])

  db.init_app(app)
  create_db()

def create_db():
  with app.app_context():
    db.create_all()
    admin = User.query.filter_by(username='admin').first()
    if not admin:
      admin = User('','admin','test')
      db.session.add(admin)
      db.session.commit()

def clear_db():
  with app.app_context():
    db.session.commit()
    db.drop_all()

def recreate_db():
  clear_db()
  create_db()

if __name__ == "__main__":
  cli.load_dotenv()
  from db import *
  configure_app(is_flask=False)
else:
  from server.db import *
  configure_app(is_flask=True)

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
  filename = file.filename
  if filename == '':
    return Response("filename is blank",400,True).end()
  if not is_allowed_file(filename):
    return Response("file type not allowed",400,True).end()

  realname = hex_sha256.hash(filename+str(time()))
  print(realname)
  fileEntry = File(userid, realname, app.config['UPLOAD_DIR'], filename)
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



if __name__ == "__main__":
  app.run()
