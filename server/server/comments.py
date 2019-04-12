from flask import Blueprint, g, request, current_app as app
from flask_httpauth import HTTPBasicAuth
from db import *
from sqlalchemy.sql import text
from utils import *
from auth import *
from response import ResponseObject as JSONResponse

bp = Blueprint('comments', __name__, url_prefix='/comments')

@bp.route('/<file_id>',methods=['GET'])
def get_file_comments(file_id):
  result = db.engine.execute('SELECT comment_id,Comment.user_id as user_id,file_id,comment,comment_date,User.username as username FROM Comment INNER JOIN User on User.user_id = Comment.user_id WHERE file_id={ID}'.format(ID=file_id))
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/add_comment',methods=['POST'])
@auth.login_required
def add_comment():
  # shorten name for easier access
  req = request.json
  # get json data
  user_id = None if req is None else req.get('user_id',None)
  file_id = None if req is None else req.get('file_id',None)
  comment = None if req is None else req.get('comment',None)
  comment_date = datetime.datetime.now()

  # trivial validate not empty
  missing = []
  if user_id is None:
    missing.append('user_id')
  if file_id is None:
    missing.append('file_id')
  if comment is None:
    missing.append('comment')
  if comment_date is None:
    missing.append('comment_date')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # FIXME: Using sql alchemy rather than raw SQL
  file=File.query.get(file_id)
  user=User.query.get(user_id)
  file_owner=User.query.get(file.user_id)

  if file_owner.is_blocked(user):
    return JSONResponse("Commenting user is blocked from file owners content",401,True).end()

  # valid parameters, create and return it
  #newComment = Comment(user_id=user_id,file_id=file_id,comment=comment,comment_date=comment_date)
  #db.session.add(newComment)
  #db.session.commit()
  sql = text("""INSERT INTO Comment(user_id, file_id, comment, comment_date) VALUES(:user_id, :file_id, :comment, :comment_date)""")
  result = db.engine.execute(sql, user_id=user_id, file_id=file_id, comment=comment, comment_date=comment_date)
  result = db.engine.execute('SELECT comment_id,user_id,file_id,comment,comment_date FROM Comment WHERE comment_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  return JSONResponse("Comment creation failed",500,True).end()

@bp.route('/<comment_id>',methods=['DELETE'])
@auth.login_required
def remove_comment(comment_id):
  # FIXME: Using sql alchemy rather than raw SQL
  comment = Comment.query.get(comment_id)
  if g.user['user_id'] != comment.user_id:
    return JSONResponse("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT comment_id,user_id,file_id,comment,comment_date FROM Comment WHERE comment_id={ID}'.format(ID=comment_id))
  data = get_query_data(result)
  if data:
    result = db.engine.execute('DELETE FROM Comment WHERE comment_id={ID}'.format(ID=comment_id))
    return JSONResponse(data[0]).end()
  return JSONResponse("comment_id {ID} not found".format(ID=comment_id),404,True).end()

  # if comment:
  #   db.session.delete(comment)
  #   db.session.commit()
  #   return JSONResponse(comment.to_json()).end()
  # return JSONResponse("comment_id {ID} not found".format(ID=comment_id),404,True).end()
