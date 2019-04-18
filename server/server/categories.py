from flask import Blueprint, g, request, current_app as app
from flask_httpauth import HTTPBasicAuth
from db import *
from sqlalchemy.sql import text
from utils import *
from auth import *
from response import ResponseObject as JSONResponse

bp = Blueprint('categories', __name__, url_prefix='/categories')

@bp.route('',methods=['GET'])
def get_categories():
  result = db.engine.execute('SELECT category_id,category FROM Category')
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/<category_id>',methods=['GET'])
def get_category(category_id):
  result = db.engine.execute('SELECT category_id,category FROM Category WHERE category_id={ID}'.format(ID=category_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("category_id {ID} not found".format(ID=category_id),404,True).end()

@bp.route('/upload',methods=['POST'])
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
    return JSONResponse({'missing':missing},400,isError=True).end()

  # valid parameters, create and return it
  #newCategory= Category(category=category)
  #db.session.add(newCategory)
  #db.session.commit()
  sql = text("""INSERT INTO Category(category) VALUES(:category)""")
  result = db.engine.execute(sql, category=category)
  # result = db.engine.execute('INSERT INTO Category(category) VALUES({category})'.format(category=category))
  result = db.engine.execute('SELECT category_id,category FROM Category WHERE category_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("Category creation failed",500,True).end()

@bp.route('/<category_id>',methods=['DELETE'])
@admin_auth.login_required
def remove_category(category_id):
  result = db.engine.execute('SELECT category_id,category FROM Category WHERE category_id={ID}'.format(ID=category_id))
  data = get_query_data(result)
  if data:
    db.engine.execute('DELETE FROM Category WHERE category_id={ID}'.format(ID=category_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("category_id {ID} not found".format(ID=category_id),404,True).end()

  # category = Category.query.get(category_id)
  # if Category:
  #   db.session.delete(category)
  #   db.session.commit()
  #   return JSONResponse(category.to_json()).end()
  # return JSONResponse("category_id {ID} not found".format(ID=category_id),404,True).end()

@bp.route('/add_to_file',methods=['LINK'])
@auth.login_required
def add_category_to_file():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id     = None if req is None else req.get('file_id',None)
  category_id = None if req is None else req.get('category_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')
  if category_id is None:
    missing.append('category_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  file=File.query.get(file_id)
  category=Category.query.get(category_id)
  if g.user['user_id'] != file.user_id:
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.append(file)
  db.engine.execute("INSERT INTO files_categories VALUES({file_id}, {category_id})".format(file_id=file_id, category_id=category_id))
  #db.session.commit()
  return JSONResponse("Category added to file",200,False).end()

@bp.route('/remove_from_file',methods=['UNLINK'])
@auth.login_required
def remove_category_from_file():
  # shorten name for easier access
  req = request.json
  # get json data
  file_id = None if req is None else req.get('file_id',None)
  category_id = None if req is None else req.get('category_id',None)
  # trivial validate not empty
  missing = []
  if file_id is None:
    missing.append('file_id')
  if category_id is None:
    missing.append('category_id')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  category=Category.query.get(category_id)
  file=File.query.get(file_id)
  if g.user['user_id'] != file.user_id:
    return JSONResponse("Unauthorized",401,True).end()

  #playlist.files.remove(file)
  db.engine.execute("DELETE FROM files_categories WHERE file_id={file_id} AND category_id={category_id}".format(file_id=file_id, category_id=category_id))
  #db.session.commit()
  return JSONResponse("Category removed from file",200,False).end()
