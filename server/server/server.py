from os import getenv, path, mkdir, sys, unlink, listdir, stat
# workaround to allow flask to find modules
CUR_DIR = path.dirname(path.abspath(__file__))
sys.path.append(path.dirname(CUR_DIR+"/"))
from flask import Flask, Response, request, cli, g, send_file, send_from_directory
from flask_cors import CORS
import sqlalchemy
from sqlalchemy.sql import text
import datetime
from db import *
from utils import *
from auth import *
import users, files, playlists, categories, comments, keywords, messages
from response import ResponseObject as JSONResponse

# NOTES:
# flask g is for storing data during requests like a temp global dictionary

app = Flask(__name__)
app.register_blueprint(bpAdmin)
app.register_blueprint(bpLogin)
app.register_blueprint(users.bp)
app.register_blueprint(files.bp)
app.register_blueprint(playlists.bp)
app.register_blueprint(categories.bp)
app.register_blueprint(comments.bp)
app.register_blueprint(keywords.bp)
app.register_blueprint(messages.bp)
CORS(app, methods=['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'LINK', 'UNLINK'])
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
    try:
      db.create_all()
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
        print(err)
      if isFatal:
        print("Fatal, exiting")
        exit()
      # print(err._sql_message()) TMI message
      print("Error:",err._message(),"\nTrying to fix, recreating database")
      ERR_IN_CREATE = True
      recreate_db()
    finally:
      admin = Admin.query.filter_by(username='admin').first()
      if not admin:
        admin = Admin(username='admin',password='test')
        db.session.add(admin)
        db.session.commit()


def clear_file_store():
  folder = app.config['UPLOAD_DIR']
  for file in listdir(folder):
    file_path = path.join(folder, file)
    try:
      if path.isfile(file_path):
        unlink(file_path)
    except Exception as e:
      print('clear_file_store error',e)

def clear_db():
  with app.app_context():
    t_id = db.session.connection().connection.thread_id()
    print(t_id,'session commit')
    db.session.commit()
    t_id = db.session.connection().connection.thread_id()
    result = db.engine.execute('show variables where variable_name="FOREIGN_KEY_CHECKS"')
    data = get_query_data(result)[0]
    message = "Foreign checks are off for current session, drop statement may succeed" if data['Value'] == 'OFF' else "Foreign checks are on"
    print(t_id,message,data)
    t_id = db.session.connection().connection.thread_id()
    print(t_id,'Turning foreign checks off')
    db.engine.execute('set FOREIGN_KEY_CHECKS=0')
    t_id = db.session.connection().connection.thread_id()
    result = db.engine.execute('show variables where variable_name="FOREIGN_KEY_CHECKS"')
    data = get_query_data(result)[0]
    message = "Successfully turned off, drop statement should succeed" if data['Value'] == 'OFF' else "Failed to turn off, drop statement may error"
    print(t_id,message,data)
    t_id = db.session.connection().connection.thread_id()
    print(t_id,'Dropping all tables')
    db.drop_all()
    clear_file_store()
    db.engine.execute('set FOREIGN_KEY_CHECKS=1')

def recreate_db():
  global ERR_IN_CREATE
  clear_db()
  create_db()
  if ERR_IN_CREATE:
    print("Successfully fixed error")
    ERR_IN_CREATE = False

@app.route('/')
def index():
  return "OK"

@app.route('/db',methods=['DELETE'])
@admin_auth.login_required
def delete_db():
  recreate_db()
  return "OK"

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
