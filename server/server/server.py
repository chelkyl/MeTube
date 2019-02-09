import os
from flask import Flask, request, cli, jsonify
from passlib.hash import hex_sha256
from flask_sqlalchemy import SQLAlchemy

ALLOWED_FILE_EXT = set(['png','jpg','jpeg','gif','txt'])

app = Flask(__name__)

def configure_app(is_flask=False):
  prefix = 'server.config.' if is_flask else 'config.'
  configs = {
    'production': prefix+'ProductionCfg',
    'dev': prefix+'DevCfg',
    'test': prefix+'TestCfg',
    'default': prefix+'DevCfg'
  }
  cfg_name = os.getenv('SERVER_CFG') or 'default'
  app.config.from_object(configs[cfg_name])

  if not os.path.exists(app.config['UPLOAD_DIR']):
    os.mkdir(app.config['UPLOAD_DIR'])

  db.init_app(app)
  create_db()

def create_db():
  db.create_all(app=app)

def clear_db():
  db.drop_all(app=app)

def recreate_db():
  clear_db()
  create_db()

if __name__ == "__main__":
  cli.load_dotenv()
  from db import *
  configure_app(is_flask=False)
  create_db()
else:
  from server.db import *
  configure_app(is_flask=True)
  create_db()

@app.route('/')
def index():
  return "OK"

@app.route('/db',methods=['DELETE'])
def delete_db():
  recreate_db()
  return "OK"

def is_valid_username(name):
  return name and \
    name != '' and \
    len(User.query.filter_by(username=name).all()) == 0

@app.route('/users',methods=['POST'])
def add_user():
  reqData = request.get_json()
  username = reqData['username']
  if is_valid_username(username):
    newUser = User(username)
    db.session.add(newUser)
    db.session.commit()
    return jsonify(newUser.to_json())
  else:
    return "username not unique", 400

@app.route('/users/<user_id>',methods=['DELETE'])
def remove_user(user_id):
  user = User.query.get(user_id)
  if user:
    db.session.delete(user)
    db.session.commit()
    return user.to_json()
  return "user_id not found", 404

# TODO: filter, sort, paginate
@app.route('/users',methods=['GET'])
def get_users():
  result = db.engine.execute('SELECT * FROM User')
  #for row in result:
  #  print("username:",row['username'])

  #users = User.query
  #return jsonify([user.to_json() for user in users.all()])

# TODO:
# {
#		"errors": [
#      {"code":40,"message":"user_id not found"}
#   ]
# }
@app.route('/users/<user_id>',methods=['GET'])
def get_user(user_id):
  user = User.query.get(user_id)
  if user:
    return jsonify(user.to_json())
  else:
    return "user_id not found", 404

def is_allowed_file(fname):
  return '.' in fname and fname.rsplit('.',1)[1].lower() in ALLOWED_FILE_EXT

@app.route('/files/upload',methods=['POST'])
def upload_file():
  if 'file' not in request.files:
    return "file not given", 400
  file = request.files['file']
  filename = file.filename
  if filename == '':
    return "file is blank", 400
  if not is_allowed_file(filename):
    return "file not allowed", 400
  
  userid = request.form['user_id']
  if userid == None:
    return "user_id not given", 400

  realname = hex_sha256.hash(filename)
  fileEntry = File(userid, realname, app.config['UPLOAD_DIR'], filename)
  db.session.add(fileEntry)
  db.session.commit()
  if fileEntry.file_id:
    try:
      file.save(fileEntry.path)
      return jsonify(fileEntry.to_json())
    except FileNotFoundError:
      db.session.delete(fileEntry)
      db.session.commit()
      return 'Could not save file', 500
  return 'Could not add file to database', 500



if __name__ == "__main__":
  app.run()
