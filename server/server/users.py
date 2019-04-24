from flask import Blueprint, g, request, current_app as app
from flask_httpauth import HTTPBasicAuth
from db import *
from sqlalchemy.sql import text
from utils import *
from auth import *
from response import ResponseObject as JSONResponse
import time

bp = Blueprint('users', __name__, url_prefix='/users')

@bp.route('',methods=['GET'])
def get_users():
  result = db.engine.execute('SELECT user_id,username,email,channel_description FROM User')
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()
  # users = User.query
  # return JSONResponse([user.to_json() for user in users.all()]).end()

@bp.route('/<user_id>',methods=['GET'])
def get_user(user_id):
  result = db.engine.execute('SELECT user_id,username,email,channel_description FROM User WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()
  # user = User.query.get(user_id)
  # if user:
  #   return JSONResponse(user.to_json()).end()
  # else:
  #   return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()

@bp.route('',methods=['POST'])
def add_user():
  # shorten name for easier access
  req = request.json
  if not req:
    return JSONResponse("Request missing JSON body",400,True).end()

  # get json data
  email    = req.get('email',None)
  username = req.get('username',None)
  password = req.get('password',None)
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
  # result = db.engine.execute('SELECT user_id FROM User WHERE username="{UNAME}"'.format(UNAME=username))
  unameUniq = len(get_query_data(result)) == 0
  result = db.engine.execute(text("SELECT user_id FROM User WHERE email=:email"), email=email)
  # result = db.engine.execute('SELECT user_id FROM User WHERE email="{EMAIL}"'.format(EMAIL=email))
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
  # result = db.engine.execute('INSERT INTO User (username,email,password_hash,channel_description) VALUES({uname},{email},{password_hash},{channel_description})'.format(uname=username,email=email,password_hash=hash_password(password),channel_description=channel_description))
  # newUser = User(email=email,username=username,password=password)
  # db.session.add(newUser)
  # db.session.commit()
  result = db.engine.execute('SELECT user_id,username,email,channel_description FROM User WHERE user_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    token = make_auth_token(app.config['SECRET_KEY'],data[0]['user_id'],app.config['DEFAULT_SESSION_LENGTH_HRS']*3600)
    data[0]['token'] = token.access_token
    data[0]['expires_in_secs'] = token.expires_in_secs
    return JSONResponse(data[0]).end()
  return JSONResponse("Could not find created account",500,True).end()

@bp.route('/<user_id>',methods=['PATCH'])
@auth.login_required
def edit_user(user_id):
  result = db.engine.execute('SELECT * FROM User WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    if g.user['user_id'] != data[0]['user_id']:
      return JSONResponse("Unauthorized",401,True).end()

    oldData = data[0]

    # shorten name for easier access
    req = request.json
    if not req:
      return JSONResponse("Request missing JSON body",400,True).end()

    # get json data
    email       = req.get('email',oldData['email'])
    username    = req.get('username',oldData['username'])
    newPassword = req.get('password',None)
    password_hash = hash_password(newPassword) if newPassword else oldData['password_hash']
    description = req.get('channel_description',oldData['channel_description'])

    # make sure username and email are unique
    result = db.engine.execute(text("SELECT user_id FROM User WHERE username=:uname AND user_id!=:id"), uname=username, id=user_id)
    # result = db.engine.execute('SELECT user_id FROM User WHERE username="{UNAME}"'.format(UNAME=username))
    unameUniq = len(get_query_data(result)) == 0
    result = db.engine.execute(text("SELECT user_id FROM User WHERE email=:email AND user_id!=:id"), email=email, id=user_id)
    # result = db.engine.execute('SELECT user_id FROM User WHERE email="{EMAIL}"'.format(EMAIL=email))
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

    sql = text("UPDATE User SET username=:UNAME,email=:EMAIL,channel_description=:DESC,password_hash=:PW_HASH WHERE user_id={ID}".format(ID=user_id))
    db.engine.execute(sql,UNAME=username,EMAIL=email,DESC=description,PW_HASH=password_hash)
    result = db.engine.execute('SELECT user_id,username,email,channel_description FROM User WHERE user_id={ID}'.format(ID=user_id))
    data = get_query_data(result)
    return JSONResponse(data[0]).end()
  return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()

@bp.route('/<user_id>',methods=['DELETE'])
@auth.login_required
def remove_user(user_id):
  if g.user['user_id'] != int(user_id):
    return JSONResponse("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT user_id,username,email,channel_description FROM User WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    # Unlinks neccessary relationships
    # result = db.engine.execute('DELETE FROM subscribers WHERE subscribed_id={ID} or subscribing_id={ID}'.format(ID=user_id))
    # result = db.engine.execute('DELETE FROM contacts WHERE contacted_id={ID} or contacting_id={ID}'.format(ID=user_id))
    # result = db.engine.execute('DELETE FROM friends WHERE friended_id={ID} or friending_id={ID}'.format(ID=user_id))
    # result = db.engine.execute('DELETE FROM blocks WHERE blocked_id={ID} or blocking_id={ID}'.format(ID=user_id))
    # result = db.engine.execute('DELETE FROM user_favorites WHERE user_id={ID}'.format(ID=user_id))
    result = db.engine.execute('DELETE FROM User WHERE user_id={ID}'.format(ID=user_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()

  # user = User.query.get(user_id)
  # if user:
  #   db.session.delete(user)
  #   db.session.commit()
  #   return JSONResponse(user.to_json()).end()
  # return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()

@bp.route('/<user_id>/contacts',methods=['GET'])
def get_contacts(user_id):
  result = db.engine.execute('SELECT contacting_id, contacted_id, User.username FROM contacts INNER JOIN User ON User.user_id=contacted_id WHERE contacting_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/add_contact',methods=['LINK'])
@auth.login_required
def add_contact():
  # shorten name for easier access
  req = request.json
  if not req:
    return JSONResponse("Request missing JSON body",400,True).end()

  # get json data
  contacting_id = req.get('contacting_id',None)
  contacted_id  = req.get('contacted_id',None)
  # trivial validate not empty
  missing = []
  if contacting_id is None:
    missing.append('contacting_id')
  if contacted_id is None:
    missing.append('contacted_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  contacting_user=User.query.get(contacting_id)
  contacted_user=User.query.get(contacted_id)

  if contacted_user.is_blocked(contacting_user):
    return JSONResponse("Contacting user is blocked",401,True).end()

  if not contacting_user.is_contact(contacted_user):
    #contacting_user.contacted.append(contacted_user)
    db.engine.execute("INSERT INTO contacts VALUES({contacting_id}, {contacted_id})".format(contacting_id=contacting_id, contacted_id=contacted_id))
    #db.session.commit()
    return JSONResponse("Contact created",200,False).end()
  return JSONResponse("Contact already exists",404,True).end()

@bp.route('/remove_contact',methods=['UNLINK'])
@auth.login_required
def remove_contact():
  # shorten name for easier access
  req = request.json
  if not req:
    return JSONResponse("Request missing JSON body",400,True).end()

  # get json data
  contact_removing_id = req.get('contact_removing_id',None)
  contact_removed_id  = req.get('contact_removed_id',None)
  # trivial validate not empty
  missing = []
  if contact_removing_id is None:
    missing.append('contact_removing_id')
  if contact_removed_id is None:
    missing.append('contact_removed_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  contact_removing=User.query.get(contact_removing_id)
  contact_removed=User.query.get(contact_removed_id)
  if contact_removing.is_contact(contact_removed):
    # Unlinks neccessary relationships
    # sent_messages = Message.query.filter_by(contacting_id=contact_removing_id, contacted_id=contact_removed_id).all()
    # received_messages = Message.query.filter_by(contacting_id=contact_removed_id, contacted_id=contact_removing_id).all()
    # for message in sent_messages:
    #   db.engine.execute('DELETE FROM Message WHERE message_id={ID}'.format(ID=message.message_id))
    # for message in received_messages:
    #   db.engine.execute('DELETE FROM Message WHERE message_id={ID}'.format(ID=message.message_id))
    # FIXME: should removing a contact delete your messages with them?
    #db.engine.execute('DELETE FROM Message WHERE contacted_id={contacted_id} and contacting_id={contacting_id}'.format(contacting_id=contact_removing_id,contacted_id=contact_removed_id))
    #db.engine.execute('DELETE FROM Message WHERE contacted_id={contacting_id} and contacting_id={contacted_id}'.format(contacting_id=contact_removing_id,contacted_id=contact_removed_id))

    #contact_removing.contacted.remove(contact_removed)
    db.engine.execute("DELETE FROM contacts WHERE (contacting_id={contacting_id} AND contacted_id={contacted_id})".format(contacting_id=contact_removing_id, contacted_id=contact_removed_id))

    #db.session.commit()
    return JSONResponse("Contact removed",200,False).end()
  return JSONResponse("No contact exists",404,True).end()

@bp.route('/subscribe',methods=['LINK'])
@auth.login_required
def subscribe():
  # shorten name for easier access
  req = request.json
  if not req:
    return JSONResponse("Request missing JSON body",400,True).end()

  # get json data
  subscribing_id = req.get('subscribing_id',None)
  subscribed_id  = req.get('subscribed_id',None)
  # trivial validate not empty
  missing = []
  if subscribing_id is None:
    missing.append('subscribing_id')
  if subscribed_id is None:
    missing.append('subscribed_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  subscribing_user=User.query.get(subscribing_id)
  subscribed_user=User.query.get(subscribed_id)

  if subscribed_user.is_blocked(subscribing_user):
    return JSONResponse("Subscribing user is blocked",401,True).end()

  if not subscribing_user.is_subscriber(subscribed_user):
    #subscribing_user.subscribed.append(subscribed_user)
    db.engine.execute("INSERT INTO subscribers VALUES({subscribing_id}, {subscribed_id})".format(subscribing_id=subscribing_id, subscribed_id=subscribed_id))
    #db.session.commit()
    return JSONResponse("Subscription created",200,False).end()
  return JSONResponse("Subscription already exists",404,True).end()

@bp.route('/unsubscribe',methods=['UNLINK'])
@auth.login_required
def unsubscribe():
  # shorten name for easier access
  req = request.json
  if not req:
    return JSONResponse("Request missing JSON body",400,True).end()

  # get json data
  unsubscribing_id = req.get('unsubscribing_id',None)
  unsubscribed_id  = req.get('unsubscribed_id',None)
  # trivial validate not empty
  missing = []
  if unsubscribing_id is None:
    missing.append('unsubscribing_id')
  if unsubscribed_id is None:
    missing.append('unsubscribed_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  unsubscribing_user=User.query.get(unsubscribing_id)
  unsubscribed_user=User.query.get(unsubscribed_id)
  if unsubscribing_user.is_subscriber(unsubscribed_user):
    #unsubscribing_user.subscribed.remove(unsubscribed_user)
    db.engine.execute("DELETE FROM subscribers WHERE subscribing_id={unsubscribing_id} AND subscribed_id={unsubscribed_id}".format(unsubscribing_id=unsubscribing_id, unsubscribed_id=unsubscribed_id))
    #db.session.commit()
    return JSONResponse("Subscription removed",200,False).end()
  return JSONResponse("No subscription exists",404,True).end()

@bp.route('/subscribers',methods=['GET'])
def get_subscribers():
  result = db.engine.execute('SELECT user_id,username,COUNT(subscribing_id) as subscribers FROM subscribers INNER JOIN User ON subscribed_id = user_id GROUP BY subscribed_id')
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/<user_id>/subscribers',methods=['GET'])
def get_user_subscribers(user_id):
  result = db.engine.execute('SELECT user_id,username,COUNT(subscribing_id) as subscribers FROM subscribers INNER JOIN User ON subscribed_id = user_id WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("Not found",404,True).end()

@bp.route('/<user_id>/subscribers_info',methods=['GET'])
def get_user_subscribers_info(user_id):
  result = db.engine.execute('SELECT subscribing_id, subscribed_id, User.username FROM subscribers INNER JOIN User ON User.user_id=subscribed_id WHERE subscribing_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/friend',methods=['LINK'])
@auth.login_required
def friend():
  # shorten name for easier access
  req = request.json
  if not req:
    return JSONResponse("Request missing JSON body",400,True).end()

  # get json data
  friending_id = req.get('friending_id',None)
  friended_id  = req.get('friended_id',None)
  # trivial validate not empty
  missing = []
  if friending_id is None:
    missing.append('friending_id')
  if friended_id is None:
    missing.append('friended_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  friending_user=User.query.get(friending_id)
  friended_user=User.query.get(friended_id)

  if friended_user.is_blocked(friending_user):
    return JSONResponse("Friending user is blocked",401,True).end()

  if not friending_user.is_friend(friended_user):
    #friending_user.friended.append(friended_user)
    db.engine.execute("INSERT INTO friends VALUES({friending_id}, {friended_id})".format(friending_id=friending_id, friended_id=friended_id))
    #db.session.commit()
    return JSONResponse("Friendship created",200,False).end()
  return JSONResponse("Friendship already exists",404,True).end()

@bp.route('/unfriend',methods=['UNLINK'])
@auth.login_required
def unfriend():
  # shorten name for easier access
  req = request.json
  if not req:
    return JSONResponse("Request missing JSON body",400,True).end()

  # get json data
  unfriending_id = req.get('unfriending_id',None)
  unfriended_id  = req.get('unfriended_id',None)
  # trivial validate not empty
  missing = []
  if unfriending_id is None:
    missing.append('unfriending_id')
  if unfriended_id is None:
    missing.append('unfriended_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  unfriending_user=User.query.get(unfriending_id)
  unfriended_user=User.query.get(unfriended_id)
  if unfriending_user.is_friend(unfriended_user):
    #unfriending_user.friended.remove(unfriended_user)
    db.engine.execute("DELETE FROM friends WHERE friending_id={unfriending_id} AND friended_id={unfriended_id}".format(unfriending_id=unfriending_id, unfriended_id=unfriended_id))
    #db.session.commit()
    return JSONResponse("Friendship removed",200,False).end()
  return JSONResponse("No friendship exists",404,True).end()

@bp.route('/block',methods=['LINK'])
@auth.login_required
def block():
  # shorten name for easier access
  req = request.json
  if not req:
    return JSONResponse("Request missing JSON body",400,True).end()

  # get json data
  blocking_id = req.get('blocking_id',None)
  blocked_id  = req.get('blocked_id',None)
  # trivial validate not empty
  missing = []
  if blocking_id is None:
    missing.append('blocking_id')
  if blocked_id is None:
    missing.append('blocked_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  blocking_user=User.query.get(blocking_id)
  blocked_user=User.query.get(blocked_id)
  if not blocking_user.is_blocked(blocked_user):
    #blocking_user.blocked.append(blocked_user)
    db.engine.execute("INSERT INTO blocks VALUES({blocking_id}, {blocked_id})".format(blocking_id=blocking_id, blocked_id=blocked_id))
    #db.session.commit()
    return JSONResponse("Blocking created",200,False).end()
  return JSONResponse("Blocking already exists",404,True).end()

@bp.route('/unblock',methods=['UNLINK'])
@auth.login_required
def unblock():
  # shorten name for easier access
  req = request.json
  if not req:
    return JSONResponse("Request missing JSON body",400,True).end()

  # get json data
  unblocking_id = req.get('unblocking_id',None)
  unblocked_id  = req.get('unblocked_id',None)
  # trivial validate not empty
  missing = []
  if unblocking_id is None:
    missing.append('unblocking_id')
  if unblocked_id is None:
    missing.append('unblocked_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  unblocking_user=User.query.get(unblocking_id)
  unblocked_user=User.query.get(unblocked_id)
  if unblocking_user.is_blocked(unblocked_user):
    #unblocking_user.blocked.remove(unblocked_user)
    db.engine.execute("DELETE FROM blocks WHERE blocking_id={unblocking_id} AND blocked_id={unblocked_id}".format(unblocking_id=unblocking_id, unblocked_id=unblocked_id))
    #db.session.commit()
    return JSONResponse("Blocking removed",200,False).end()
  return JSONResponse("No blocking exists",404,True).end()

@bp.route('/<user_id>/favorites',methods=['GET'])
@auth.login_required
def get_favorites(user_id):
  result = db.engine.execute('SELECT * FROM user_favorites INNER JOIN File on user_favorites.file_id = File.file_id WHERE user_favorites.user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

#TODO: replace routes with /<user_id>/favorites
@bp.route('<user_id>/favorites',methods=['LINK'])
@auth.login_required
def favorite(user_id):
  result = db.engine.execute('SELECT * FROM User WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    # shorten name for easier access
    req = request.json
    if not req:
      return JSONResponse("Request missing JSON body",400,True).end()

    # get json data
    file_id = req.get('file_id',None)
    # trivial validate not empty
    missing = []
    if file_id is None:
      missing.append('file_id')

    # return error if missing any
    if missing:
      return JSONResponse({'missing':missing},400,isError=True).end()

    # FIXME: Using sql alchemy rather than raw SQL
    file=File.query.get(file_id)
    user=User.query.get(user_id)
    file_owner=User.query.get(file.user_id)

    if file_owner.is_blocked(user):
      return JSONResponse("Favoriting user is blocked from file owners content",401,True).end()

    if not user.is_favorite(file):
      #user.favorites.append(file)
      db.engine.execute("INSERT INTO user_favorites VALUES({file_id}, {user_id})".format(file_id=file_id, user_id=user_id))
      #db.session.commit()
      return JSONResponse("User favorite created",200,False).end()
    return JSONResponse("User favorite already exists",404,True).end()
  return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()

@bp.route('<user_id>/favorites',methods=['UNLINK'])
@auth.login_required
def unfavorite(user_id):
  result = db.engine.execute('SELECT * FROM User WHERE user_id={ID}'.format(ID=user_id))
  data = get_query_data(result)
  if data:
    # shorten name for easier access
    req = request.json
    if not req:
      return JSONResponse("Request missing JSON body",400,True).end()

    # get json data
    file_id = req.get('file_id',None)
    # trivial validate not empty
    missing = []
    if file_id is None:
      missing.append('file_id')

    # return error if missing any
    if missing:
      return JSONResponse({'missing':missing},400,isError=True).end()

    # FIXME: Using sql alchemy rather than raw SQL
    user=User.query.get(user_id)
    file=File.query.get(file_id)
    if user.is_favorite(file):
      #user.favorites.remove(file)
      db.engine.execute("DELETE FROM user_favorites WHERE file_id={file_id} AND user_id={user_id}".format(file_id=file_id, user_id=user_id))
      #db.session.commit()
      return JSONResponse("User favorite removed",200,False).end()
    return JSONResponse("No favorite exists",404,True).end()
  return JSONResponse("user_id {ID} not found".format(ID=user_id),404,True).end()
