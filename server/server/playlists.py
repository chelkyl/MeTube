from flask import Blueprint, g, request, current_app as app
from flask_httpauth import HTTPBasicAuth
from db import *
from sqlalchemy.sql import text
from utils import *
from auth import *
from response import ResponseObject as JSONResponse

bp = Blueprint('playlists', __name__, url_prefix='/playlists')

@bp.route('',methods=['GET'])
def get_playlists():
  result = db.engine.execute('SELECT playlist_id,User.user_id,title,description,username FROM Playlist INNER JOIN User ON Playlist.user_id = User.user_id')
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/<playlist_id>',methods=['GET'])
def get_playlist(playlist_id):
  result = db.engine.execute('SELECT playlist_id,User.user_id,title,description,username FROM Playlist INNER JOIN User ON Playlist.user_id = User.user_id WHERE playlist_id={ID}'.format(ID=playlist_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

@bp.route('/<playlist_id>/files',methods=['GET'])
def get_playlist_files(playlist_id):
  result = db.engine.execute('SELECT * FROM playlist_files WHERE playlist_id={ID}'.format(ID=playlist_id))
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/create',methods=['POST'])
@auth.login_required
def add_playlist():
  # shorten name for easier access
  req = request.json
  # get json data
  user_id     = None if req is None else req.get('user_id',None)
  title       = None if req is None else req.get('title',None)
  description = None if req is None else req.get('description',None)
  # trivial validate not empty
  missing = []
  if user_id is None:
    missing.append('user_id')
  if title is None:             #FIXME: should check if not empty
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
  # result = db.engine.execute('INSERT INTO Playlist(user_id, title, description) VALUES({user_id}, {title}, {description})'.format(user_id=user_id, title=title, description=description))
  result = db.engine.execute('SELECT * FROM Playlist WHERE playlist_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("Playlist creation failed",500,True).end()

@bp.route('/<playlist_id>',methods=['PATCH'])
@auth.login_required
def edit_playlist(playlist_id):
  result = db.engine.execute('SELECT * FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
  data = get_query_data(result)
  if data:
    if g.user['user_id'] != data[0]['user_id']:
      return JSONResponse("Unauthorized",401,True).end()
    
    oldData = data[0]
  
    # shorten name for easier access
    req = request.json
    # get json data
    title       = None if req is None else req.get('title',oldData['title'])
    description = None if req is None else req.get('description',oldData['description'])
    
    sql = text("UPDATE Playlist SET title=:TITLE,description=:DESC WHERE playlist_id={ID}".format(ID=playlist_id))
    db.engine.execute(sql,TITLE=title,DESC=description)
    result = db.engine.execute('SELECT * FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
    data = get_query_data(result)
    return JSONResponse(data[0]).end()
  return JSONResponse("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

@bp.route('/<playlist_id>',methods=['DELETE'])
@auth.login_required
def remove_playlist(playlist_id):
  # playlist = Playlist.query.get(playlist_id)
  # if g.user.user_id != int(playlist.user_id):
  #   return JSONResponse("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT * FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
  data = get_query_data(result)
  if data:
    if g.user['user_id'] != data[0]['user_id']:
      return JSONResponse("Unauthorized",401,True).end()

    # Unlinks neccessary relationships
    # db.engine.execute('DELETE FROM playlist_files WHERE playlist_id={ID}'.format(ID=playlist_id))
    db.engine.execute('DELETE FROM Playlist WHERE playlist_id={ID}'.format(ID=playlist_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

  # if Playlist:
  #   db.session.delete(playlist)
  #   db.session.commit()
  #   return JSONResponse(playlist.to_json()).end()
  # return JSONResponse("playlist_id {ID} not found".format(ID=playlist_id),404,True).end()

@bp.route('/<playlist_id>/file',methods=['LINK'])
@auth.login_required
def add_file_to_playlist(playlist_id):
  # shorten name for easier access
  req = request.json
  # get json data
  file_id     = None if req is None else req.get('file_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  file=File.query.get(file_id)
  playlist=Playlist.query.get(playlist_id)
  if g.user['user_id'] != playlist.user_id:
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.append(file)
  db.engine.execute("INSERT INTO playlist_files VALUES({file_id}, {playlist_id})".format(file_id=file_id, playlist_id=playlist_id))
  #db.session.commit()
  return JSONResponse("File added to playlist",200,False).end()

@bp.route('/<playlist_id>/file',methods=['UNLINK'])
@auth.login_required
def remove_file_from_playlist(playlist_id):
  # shorten name for easier access
  req = request.json
  # get json data
  file_id     = None if req is None else req.get('file_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  playlist=Playlist.query.get(playlist_id)
  file=File.query.get(file_id)
  if g.user['user_id'] != playlist.user_id:
    return JSONResponse("Unauthorized",401,True).end()

  if playlist.contains_file(file):
    #playlist.files.remove(file)
    db.engine.execute("DELETE FROM playlist_files WHERE file_id={file_id} AND playlist_id={playlist_id}".format(file_id=file_id, playlist_id=playlist_id))
    #db.session.commit()
    return JSONResponse("File removed from playlist",200,False).end()
  return JSONResponse("Playlist does not contain file",404,True).end()
