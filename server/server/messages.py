from flask import Blueprint, g, request, current_app as app
from flask_httpauth import HTTPBasicAuth
from db import *
from sqlalchemy.sql import text
from utils import *
from auth import *
from response import ResponseObject as JSONResponse

bp = Blueprint('messages', __name__, url_prefix='/messages')

@bp.route('/<user_id>',methods=['GET'])
def get_user_messages(user_id):
  result = db.engine.execute('SELECT message_id,contacting_id,contacted_id,message,message_date,User.username as contact_username FROM Message INNER JOIN User on User.user_id = Message.contacting_id or User.user_id = Message.contacted_id WHERE (contacting_id={ID} OR contacted_id={ID})'.format(ID=user_id))
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/upload',methods=['POST'])
@auth.login_required
def add_message():
  message_date  = datetime.datetime.now()
  print('adding message',message_date)

  # shorten name for easier access
  req = request.json
  # get json data
  message       = None if req is None else req.get('message',None)
  contacting_id = None if req is None else req.get('contacting_id',None)
  contacted_id  = None if req is None else req.get('contacted_id',None)
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

  # FIXME: Using sql alchemy rather than raw SQL
  contacting_user = User.query.get(contacting_id)
  contacted_user = User.query.get(contacted_id)

  if contacted_user.is_blocked(contacting_user):
    print('is blocked')
    return JSONResponse("Contacting user is blocked",401,True).end()

  if not contacting_user.is_contact(contacted_user):
    return JSONResponse("{ID} is not a contact to contacting user".format(ID=contacted_id),404,True).end()

  # valid parameters, create and return it
  #newMessage=Message(contacting_id=contacting_id, contacted_id=contacted_id, message=message, message_date=message_date)
  #db.session.add(newMessage)
  #db.session.commit()
  sql = text("""INSERT INTO Message(contacting_id, contacted_id, message, message_date) VALUES(:contacting_id, :contacted_id, :message, :message_date)""")
  result = db.engine.execute(sql, contacting_id=contacting_id, contacted_id=contacted_id, message=message, message_date=message_date)
  result = db.engine.execute('SELECT message_id,contacting_id,contacted_id,message,message_date FROM Message WHERE message_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("Message creation failed",500,True).end()
