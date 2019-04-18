from flask import Blueprint, g, request, current_app as app
from flask_httpauth import HTTPBasicAuth
from db import *
from sqlalchemy.sql import text
from utils import *
from auth import *
from response import ResponseObject as JSONResponse

bp = Blueprint('keywords', __name__, url_prefix='/keywords')

@bp.route('',methods=['GET'])
def get_keywords():
  result = db.engine.execute('SELECT keyword_id,keyword FROM Keyword')
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/<keyword_id>',methods=['GET'])
def get_keyword(keyword_id):
  result = db.engine.execute('SELECT keyword_id,keyword FROM Keyword WHERE keyword_id={ID}'.format(ID=keyword_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("keyword_id {ID} not found".format(ID=keyword_id),404,True).end()

@bp.route('/upload',methods=['POST'])
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
  return JSONResponse("Keyword creation failed",500,True).end()

@bp.route('/<keyword_id>',methods=['DELETE'])
@admin_auth.login_required
def remove_keyword(keyword_id):
  result = db.engine.execute('SELECT keyword_id,keyword FROM Keyword WHERE keyword_id={ID}'.format(ID=keyword_id))
  data = get_query_data(result)
  if data:
    # Unlinks neccessary relationships
    # db.engine.execute('DELETE FROM files_keywords WHERE keyword_id={ID}'.format(ID=keyword_id))
    db.engine.execute('DELETE FROM Keyword WHERE keyword_id={ID}'.format(ID=keyword_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("keyword_id {ID} not found".format(ID=keyword_id),404,True).end()

  # keyword = Keyword.query.get(keyword_id)
  # if Keyword:
  #   db.session.delete(keyword)
  #   db.session.commit()
  #   return JSONResponse(keyword.to_json()).end()
  # return JSONResponse("keyword_id {ID} not found".format(ID=keyword_id),404,True).end()

@bp.route('/add_to_file',methods=['LINK'])
@auth.login_required
def add_keyword_to_file():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id    = None if req is None else req.get('file_id',None)
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

  # FIXME: Using sql alchemy rather than raw SQL
  file=File.query.get(file_id)
  keyword=Keyword.query.get(keyword_id)
  if g.user['user_id'] != file.user_id:
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.append(file)
  db.engine.execute("INSERT INTO files_keywords VALUES({file_id}, {keyword_id})".format(file_id=file_id, keyword_id=keyword_id))
  #db.session.commit()
  return JSONResponse("Keyword added to file",200,False).end()

@bp.route('/remove_from_file',methods=['UNLINK'])
@auth.login_required
def remove_keyword_from_file():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id    = None if req is None else req.get('file_id',None)
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

  # FIXME: Using sql alchemy rather than raw SQL
  keyword=Keyword.query.get(keyword_id)
  file=File.query.get(file_id)
  if g.user['user_id'] != file.user_id:
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.remove(file)
  db.engine.execute("DELETE FROM files_keywords WHERE file_id={file_id} AND keyword_id={keyword_id}".format(file_id=file_id, keyword_id=keyword_id))
  #db.session.commit()
  return JSONResponse("Keyword removed from file",200,False).end()
