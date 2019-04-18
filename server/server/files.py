from flask import Blueprint, g, request, Response, send_file, send_from_directory, current_app as app
from flask_httpauth import HTTPBasicAuth
import os
from db import *
from sqlalchemy.sql import text
from utils import *
from auth import *
from response import ResponseObject as JSONResponse

bp = Blueprint('files', __name__, url_prefix='/files')

# extensions are lowercase
DOC_EXT   = ['txt','rtf','odf','ods','doc','docx','xls','xlsx']
IMG_EXT   = ['png','jpg','jpe','jpeg','gif','svg','bmp']
SOUND_EXT = ['weba','wav','opus','ogg','mp3','flac','aac']
VIDEO_EXT = ['webm','opgg','mp4']
ALLOWED_FILE_EXT = set(DOC_EXT+IMG_EXT+SOUND_EXT+VIDEO_EXT)

@bp.route('',methods=['GET'])
def get_files():
  result = db.engine.execute('SELECT file_id,File.user_id,title,description,permissions,upload_date,views,upvotes,downvotes,mimetype,file_type,username FROM File INNER JOIN User ON File.user_id = User.user_id')
  data = get_query_data(result)
  opts = get_request_opts(request)
  return JSONResponse(filter_sort_paginate(data,opts)).end()

@bp.route('/<file_id>',methods=['GET'])
def get_file(file_id):
  # result = db.engine.execute('SELECT file_id,user_id,title,description,permissions,upload_date,views,upvotes,downvotes,mimetype,file_type FROM File WHERE file_id={ID}'.format(ID=file_id))
  result = db.engine.execute('SELECT file_id,File.user_id,title,description,permissions,upload_date,views,upvotes,downvotes,mimetype,file_type,username FROM File INNER JOIN User ON File.user_id = User.user_id WHERE file_id={ID}'.format(ID=file_id))
  data = get_query_data(result)
  if data:
    return JSONResponse(data[0]).end()
  else:
    return JSONResponse("file_id {ID} not found".format(ID=file_id),404,True).end()

# TODO: check user permissions
@bp.route('/<file_id>/g', methods=['GET'])
def get_actual_file(file_id):
  result = db.engine.execute('SELECT user_id,title,permissions,mimetype,file_type FROM File WHERE file_id={ID}'.format(ID=file_id))
  data = get_query_data(result)
  if not data:
    return JSONResponse("file_id {ID} not found".format(ID=file_id),404,True).end()

  file_path = path.join(app.config['UPLOAD_DIR'], str(file_id))
  if not path.isfile(file_path):
    return JSONResponse("file for {ID} not found".format(ID=file_id),404,True).end()

  info = data[0]
  ranges = request.headers.get('Range',None)
  if ranges:
    # FIXME: should check if ext in SOUND_EXT or ext in VIDEO_EXT
    beg, end = ranges[ranges.find('=')+1:].split('-')
    length = -1
    beg = int(beg)
    file_size = os.path.getsize(file_path)
    if beg >= file_size:
      return JSONResponse("Invalid range",400,isError=True).end()
    if end:
      length = int(end) + 1 - beg
    else:
      chunk_end = (int(beg) + 1000 * 1000 * 1)
      length = chunk_end if beg+chunk_end <= file_size else file_size-beg
    with open(file_path, 'rb') as f:
      f.seek(beg)
      file_chunk = f.read(length)
    res = Response(file_chunk,206,mimetype=info['mimetype'],content_type=info['mimetype'],direct_passthrough=True)
    res.headers.add('Content-Range', 'bytes {b}-{l}/{t}'.format(b=beg,l=beg+length-1,t=file_size))
    return res
  # no range header given, send entire file
  else:
    return send_file(file_path, mimetype=info['mimetype'])

def is_allowed_file(fname):
  return '.' in fname and fname.rsplit('.',1)[1].lower() in ALLOWED_FILE_EXT

@bp.route('/upload',methods=['POST'])
@auth.login_required
def upload_file():
  user_id = g.user['user_id']
  upload_date = datetime.datetime.now()

  if 'file' not in request.files:
    return JSONResponse("missing file in request",400,True).end()

  #TODO: check mimetype or extension?
  file = request.files['file']
  mimetype = file.content_type
  filename = file.filename
  if filename == '':
    return JSONResponse("filename is blank",400,True).end()
  if not is_allowed_file(filename):
    return JSONResponse("file type not allowed",400,True).end()

  title = request.form.get('title',None)
  description = request.form.get('description','')
  permissions = request.form.get('permissions','private')
  file_type = request.form.get('file_type',None)
  # trivial validate not empty
  missing = []
  if title is None:
    missing.append('title')
  if file_type is None:
    missing.append('file_type')

  # return error if missing any
  if missing:
    return JSONResponse({'missing':missing},400,isError=True).end()

  # # make sure title is unique
  # result = db.engine.execute(text('SELECT * FROM File WHERE title=:TITLE'),TITLE=title)
  # data = get_query_data(result)
  # # titleUniq = len(File.query.filter_by(title=title).all()) == 0
  # notUniq = []
  # if len(data) != 0:
  #   notUniq.append('title')
  # if notUniq:
  #   return JSONResponse({'not unique':notUniq},400,isError=True).end()

  #fileEntry = File(user_id=user_id,title=title,description=description,permissions=permissions,upload_date = upload_date,views=0,upvotes=0,downvotes=0,mimetype=mimetype,file_type=file_type)
  #db.session.add(fileEntry)
  #db.session.commit()
  sql = text("""INSERT INTO File(user_id, title, description, permissions, upload_date, views, upvotes, downvotes, mimetype, file_type) VALUES(:user_id, :title, :description, :permissions, :upload_date, :views, :upvotes, :downvotes, :mimetype, :file_type)""")
  result = db.engine.execute(sql, user_id=user_id,title=title,description=description,permissions=permissions,upload_date=upload_date,views=0,upvotes=0,downvotes=0,mimetype=mimetype,file_type=file_type)
  # result = db.engine.execute('INSERT INTO File(user_id, title, description, permissions, upload_date, views, upvotes, downvotes, mimetype, file_type) VALUES({user_id}, {title}, {description}, {permissions}, {upload_date}, {views}, {upvotes}, {downvotes}, {mimetype}, {file_type})'.format(user_id=user_id,title=title,description=description,permissions=permissions,upload_date=upload_date,views=0,upvotes=0,downvotes=0,mimetype=mimetype,file_type=file_type))
  result = db.engine.execute('SELECT * FROM File WHERE file_id={ID}'.format(ID=result.lastrowid))
  data = get_query_data(result)

  if data and data[0]['file_id']:
    try:
      file.save(app.config['UPLOAD_DIR']+"/"+str(data[0]['file_id']))
      return JSONResponse(data[0]).end()
    except FileNotFoundError:
      #db.session.delete(fileEntry)
      #db.session.commit()
      db.engine.execute('DELETE FROM File WHERE file_id={ID}'.format(ID=data[0]['file_id']))
      return JSONResponse("Could not save file",400,True).end()
  return JSONResponse("Could not add file to database",500,True).end()

@bp.route('/<file_id>',methods=['PATCH'])
@auth.login_required
def edit_file(file_id):
  result = db.engine.execute('SELECT * FROM File WHERE file_id={ID}'.format(ID=file_id))
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
    permissions = None if req is None else req.get('permissions',oldData['permissions'])

    # # make sure title is unique
    # result = db.engine.execute(text('SELECT * FROM File WHERE file_id!=:ID AND title=:TITLE'),ID=file_id,TITLE=title)
    # data = get_query_data(result)
    # # titleUniq = len(File.query.filter_by(title=title).all()) == 0
    # notUniq = []
    # if len(data) != 0:
    #   notUniq.append('title')
    # if notUniq:
    #   return JSONResponse({'not unique':notUniq},400,isError=True).end()
    
    sql = text("UPDATE File SET title=:TITLE,description=:DESC,permissions=:PERM WHERE file_id={ID}".format(ID=file_id))
    db.engine.execute(sql,TITLE=title,DESC=description,PERM=permissions)
    result = db.engine.execute('SELECT * FROM File WHERE file_id={ID}'.format(ID=file_id))
    data = get_query_data(result)
    return JSONResponse(data[0]).end()
  return JSONResponse("file_id {ID} not found".format(ID=file_id),404,True).end()

def remove_file_from_store(file_id):
  folder = app.config['UPLOAD_DIR']
  file_path = path.join(folder, str(file_id))
  try:
    if path.isfile(file_path):
      unlink(file_path)
  except Exception as e:
    print('remove_file_from_store error',e)

@bp.route('/<file_id>',methods=['DELETE'])
@auth.login_required
def remove_file(file_id):
  # file = File.query.get(file_id)
  # if g.user.user_id != int(file.user_id):
  #   return JSONResponse("Unauthorized",401,True).end()

  result = db.engine.execute('SELECT * FROM File WHERE file_id={ID}'.format(ID=file_id))
  data = get_query_data(result)
  if data:
    if g.user['user_id'] != data[0]['user_id']:
      return JSONResponse("Unauthorized",401,True).end()

    # Unlinks neccessary relationships
    # result = db.engine.execute('SELECT comment_id FROM Comment WHERE file_id={ID}'.format(ID=file_id))
    # comments=Comment.query.filter_by(file_id=file_id).all()
    # comments = get_query_data(result)
    # for comment in comments:
      # db.engine.execute('DELETE FROM Comment WHERE comment_id={ID}'.format(ID=comment.comment_id))
    # db.engine.execute('DELETE FROM user_favorites WHERE file_id={ID}'.format(ID=file_id))
    # db.engine.execute('DELETE FROM playlist_files WHERE file_id={ID}'.format(ID=file_id))
    # db.engine.execute('DELETE FROM files_categories WHERE file_id={ID}'.format(ID=file_id))
    # db.engine.execute('DELETE FROM files_keywords WHERE file_id={ID}'.format(ID=file_id))
    # db.engine.execute('DELETE FROM Comment WHERE file_id={ID}'.format(ID=file_id))
    db.engine.execute('DELETE FROM File WHERE file_id={ID}'.format(ID=file_id))
    remove_file_from_store(file_id)
    return JSONResponse(data[0]).end()
  return JSONResponse("file_id {ID} not found".format(ID=file_id),404,True).end()

  # if File:
  #   db.session.delete(file)
  #   db.session.commit()
  #   remove_file_from_store(file_id)
  #   return JSONResponse(file.to_json()).end()
  # return JSONResponse("file_id {ID} not found".format(ID=file_id),404,True).end()
