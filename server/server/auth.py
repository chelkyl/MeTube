from flask import Blueprint, g, request, current_app as app
from flask_httpauth import HTTPBasicAuth
from db import *
from utils import *
from response import ResponseObject as JSONResponse

auth = HTTPBasicAuth()
admin_auth = HTTPBasicAuth()

bpAdmin = Blueprint('admin', __name__, url_prefix='/admin')
bpLogin = Blueprint('login', __name__, url_prefix='/login')

@auth.verify_password
def verify_password(uname_or_token,password):
  # try to get data from potential token
  user_id = get_auth_token_data(app.config['SECRET_KEY'],uname_or_token)
  if user_id:
    # got user id from token
    result = db.engine.execute('SELECT * FROM User WHERE user_id={ID}'.format(ID=user_id))
    data = get_query_data(result)
    # make sure user exists
    if data:
      g.user = data[0]
      return True
    return False
  # was not token, try to validate as username and password pair
  result = db.engine.execute('SELECT * FROM User WHERE username="{UNAME}"'.format(UNAME=uname_or_token))
  data = get_query_data(result)
  if data and is_match_password(password,data[0]['password_hash']):
    g.user = data[0]
    return True
  return False
  # user = User.query.filter_by(username=username).first()
  # if not user or not user.verify_password(password):
  #   return False
  # g.user = user
  # return True

@admin_auth.verify_password
def verify_admin_password(username,password):
  result = db.engine.execute('SELECT * FROM Admin WHERE username="{UNAME}"'.format(UNAME=username))
  data = get_query_data(result)
  if data and is_match_password(password,data[0]['password_hash']):
    g.admin = data[0]
    return True
  return False
  # admin = Admin.query.filter_by(username=username).first()
  # if not admin or not admin.verify_password(password):
  #   return False
  # g.admin = admin
  # return True

@bpAdmin.route('/<admin_id>',methods=['GET'])
def get_admin(admin_id):
  result = db.engine.execute('SELECT admin_id,username FROM Admin WHERE admin_id={ID}'.format(ID=admin_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("admin_id {ID} not found".format(ID=admin_id),404,True).end()
  # admin = Admin.query.get(admin_id)
  # if admin:
  #   return JSONResponse(admin.to_json()).end()
  # else:
  #   return JSONResponse("admin_id {ID} not found".format(ID=admin_id),404,True).end()

@bpAdmin.route('',methods=['GET'])
def get_admins():
  result = db.engine.execute('SELECT user_id,username FROM Admin')
  data = get_query_data(result)
  return JSONResponse(data).end()
  # admins = Admin.query
  # return JSONResponse([admins.to_json() for admin in admins.all()]).end()

@bpLogin.route('',methods=['POST'])
def auth_user():
  req = request.json
  if req is None:
    return JSONResponse("Unauthorized",401,True).end()
  token    = req.get('token',None)
  username = req.get('username',None)
  password = req.get('password',None)

  if token:
    # try to get data from potential token
    user_id = get_auth_token_data(app.config['SECRET_KEY'],token)
    if user_id:
      # got user id from token
      result = db.engine.execute('SELECT * FROM User WHERE user_id={ID}'.format(ID=user_id))
      data = get_query_data(result)
      # make sure user exists
      if data:
        return JSONResponse("OK").end()
    return JSONResponse("Unauthorized",401,True).end()

  # validate as username and password pair
  # trivial check
  if username is None or password is None:
    return JSONResponse("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT * FROM User WHERE username="{UNAME}"'.format(UNAME=username))
  data = get_query_data(result)
  if data and is_match_password(password,data[0]['password_hash']):
    token = make_auth_token(app.config['SECRET_KEY'],data[0]['user_id'],app.config['DEFAULT_SESSION_LENGTH_HRS']*3600)
    # print('auth_user new token',token.decode('ascii'))
    return JSONResponse({
      'token': token.access_token,
      'expires_in_secs': token.expires_in_secs,
      'user_id': data[0]['user_id'],
      'username': data[0]['username']
    }).end()
  return JSONResponse("Unauthorized",401,True).end()
    # return JSONResponse("OK").end()
  # user = User.query.filter_by(username=username).first()
  # if not user or not user.verify_password(password):
  #   return JSONResponse("Unauthorized",401,True).end()
  # return JSONResponse("OK").end()
