from os import path
from json import JSONEncoder
from flask_sqlalchemy import SQLAlchemy
from passlib.hash import pbkdf2_sha256
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer,
                          BadSignature, SignatureExpired)

db = SQLAlchemy()

# NOTE: unordered dict
def get_query_data(resultProxy):
  ret = []
  for rowProxy in resultProxy:
    ret.append(dict(rowProxy.items()))
  return ret

def hash_password(password):
  pw_hash = pbkdf2_sha256.hash(password)
  return pw_hash

def is_match_password(password, hash_password):
  return pbkdf2_sha256.verify(password, hash_password)

class AuthTokens():
  def __init__(self, access, expiration_secs):
    self.access_token = access
    self.expires_in_secs = expiration_secs

def make_auth_token(secret, id, expiration_secs = 3600):
  expire_ms = expiration_secs*1000
  s = Serializer(secret, expires_in=expire_ms)
  access_token = s.dumps({'id': id}).decode('ascii')
  return AuthTokens(access_token, expiration_secs)

def get_auth_token_data(secret, token):
  # print('get_auth_token_data',secret,token)
  s = Serializer(secret)
  try:
    data = s.loads(token)
    # print('get_auth_token_data',data)
    return data['id']
  except SignatureExpired:
    # print('get_auth_token_data SignatureExpired')
    return None
  except BadSignature:
    # print('get_auth_token_data BadSignature')
    return None
  except KeyError:
    # print('get_auth_token_data KeyError')
    return None

subscribers = db.Table('subscribers',
  db.Column('subscribing_id', db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE")),
  db.Column('subscribed_id', db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE"))
)

contacts = db.Table('contacts',
  db.Column('contacting_id', db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE")),
  db.Column('contacted_id', db.Integer, db.ForeignKey('User.user_id', ondelete="CASCADE"))
)

friends = db.Table('friends',
  db.Column('friending_id', db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE")),
  db.Column('friended_id', db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE"))
)

blocks = db.Table('blocks',
  db.Column('blocking_id', db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE")),
  db.Column('blocked_id', db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE"))
)

user_favorites = db.Table('user_favorites',
  db.Column('file_id', db.Integer, db.ForeignKey('File.file_id',ondelete="CASCADE"), primary_key=True),
  db.Column('user_id', db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE"), primary_key=True)
)

playlist_files = db.Table('playlist_files',
  db.Column('file_id', db.Integer, db.ForeignKey('File.file_id',ondelete="CASCADE"), primary_key=True),
  db.Column('playlist_id', db.Integer, db.ForeignKey('Playlist.playlist_id',ondelete="CASCADE"), primary_key=True)
)

files_categories = db.Table('files_categories',
  db.Column('file_id', db.Integer, db.ForeignKey('File.file_id',ondelete="CASCADE"), primary_key=True),
  db.Column('category_id', db.Integer, db.ForeignKey('Category.category_id',ondelete="CASCADE"), primary_key=True)
)

files_keywords = db.Table('files_keywords',
  db.Column('file_id', db.Integer, db.ForeignKey('File.file_id',ondelete="CASCADE"), primary_key=True),
  db.Column('keyword_id', db.Integer, db.ForeignKey('Keyword.keyword_id',ondelete="CASCADE"), primary_key=True)
)

class Admin(db.Model):
  __tablename__ = 'Admin'

  def __init__(self, username, password):
    self.username = username
    self.password_hash = self.hash_password(password)

  admin_id = db.Column(db.Integer, primary_key=True)
  username = db.Column(db.String(40), unique=True, nullable=False)
  password_hash = db.Column(db.String(128), unique=True, nullable=False)

  def hash_password(self, password):
    pw_hash = pbkdf2_sha256.hash(password)
    return pw_hash

  def verify_password(self, password):
    return pbkdf2_sha256.verify(password, self.password_hash)

  def to_json(self):
    return {
      'admin_id': self.admin_id,
      'username': self.username,
      'password': self.password_hash
    }

  def __repr__(self):
    return '<Admin {id} [{name}]>'.format(id=self.admin_id,name=self.username)

class User(db.Model):
  __tablename__ = 'User'

  def __init__(self, username, email, password, channel_description=''):
    self.username = username
    self.email = email
    self.password_hash = self.hash_password(password)
    self.channel_description = channel_description

  user_id = db.Column(db.Integer, primary_key=True)
  username = db.Column(db.String(40), unique=True, nullable=False)
  email = db.Column(db.String(320), unique=True, nullable=False)
  password_hash = db.Column(db.String(128), unique=True, nullable=False)
  channel_description = db.Column(db.String(400), nullable=False)

  playlists = db.relationship('Playlist', backref='user', lazy=True, cascade="all, delete-orphan")
  files = db.relationship('File', backref='user', lazy=True, cascade="all, delete-orphan")
  comments = db.relationship('Comment', backref='user', lazy=True, cascade="all, delete-orphan")
  subscribed = db.relationship('User', secondary=subscribers, primaryjoin=(subscribers.c.subscribing_id == user_id), secondaryjoin=(subscribers.c.subscribed_id == user_id), lazy='dynamic', backref=db.backref('subscribers', lazy='dynamic'))
  favorites = db.relationship('File', secondary=user_favorites, lazy='dynamic', backref=db.backref('users', lazy=True))
  contacted = db.relationship('User', secondary=contacts, primaryjoin=(contacts.c.contacting_id == user_id), secondaryjoin=(contacts.c.contacted_id == user_id), lazy='dynamic', backref=db.backref('contacts', lazy='dynamic'))
  friended = db.relationship('User', secondary=friends, primaryjoin=(friends.c.friending_id == user_id), secondaryjoin=(friends.c.friended_id == user_id), lazy='dynamic', backref=db.backref('friends', lazy='dynamic'))
  blocked = db.relationship('User', secondary=blocks, primaryjoin=(blocks.c.blocking_id == user_id), secondaryjoin=(blocks.c.blocked_id == user_id), lazy='dynamic', backref=db.backref('blocks', lazy='dynamic'))

  def hash_password(self, password):
    pw_hash = pbkdf2_sha256.hash(password)
    return pw_hash

  def verify_password(self, password):
    return pbkdf2_sha256.verify(password, self.password_hash)

  def to_json(self):
    return {
      'user_id': self.user_id,
      'email': self.email,
      'username': self.username,
      'password': self.password_hash,
      'channel_description': self.channel_description
    }

  def is_contact(self, user):
    return self.contacted.filter(
      contacts.c.contacted_id == user.user_id).count() > 0

  def is_subscriber(self, user):
    return self.subscribed.filter(
      subscribers.c.subscribed_id == user.user_id).count() > 0

  def is_friend(self, user):
    return self.friended.filter(
      friends.c.friended_id == user.user_id).count() > 0

  def is_blocked(self, user):
    return self.blocked.filter(
      blocks.c.blocked_id == user.user_id).count() > 0

  def is_favorite(self, file):
    return self.favorites.filter(
      user_favorites.c.file_id == file.file_id).count() > 0

  def __repr__(self):
    return '<User {id} [{name}]>'.format(id=self.user_id,name=self.username)

class Playlist(db.Model):
  __tablename__ = 'Playlist'

  def __init__(self, user_id, title, description):
    self.user_id = user_id
    self.title = title
    self.description = description

  playlist_id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE"), nullable=False)
  title = db.Column(db.String(100), nullable=False)
  description = db.Column(db.String(400), nullable=False)
  #TODO: add creation date
  #TODO: add views
  #TODO: add permissions

  files = db.relationship('File', secondary=playlist_files, lazy='dynamic', backref=db.backref('playlists', lazy=True, cascade="all"), cascade="all")

  def to_json(self):
    return {
      'playlist_id': self.playlist_id,
      'user_id': self.user_id,
      'title': self.title,
      'description': self.description
    }

  def contains_file(self, file):
    return self.files.filter(
      playlist_files.c.file_id == file.file_id).count() > 0

  def __repr__(self):
    return '<Playlist {id} [{owner}]>'.format(id=self.playlist_id,owner=self.user_id)

#TODO: need way to track which user upvoted
class File(db.Model):
  __tablename__ = 'File'

  def __init__(self, user_id, title, description, permissions, upload_date, views, upvotes, downvotes, mimetype, file_type):
    self.user_id = user_id
    self.title = title
    self.description = description
    self.permissions = permissions
    self.upload_date = upload_date
    self.views = views
    self.upvotes = upvotes
    self.downvotes = downvotes
    self.mimetype = mimetype
    self.file_type = file_type

  file_id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE"), nullable=False)
  title = db.Column(db.String(100), unique=False, nullable=False)
  description = db.Column(db.String(400), nullable=False)
  permissions = db.Column(db.String(40), nullable=False)
  upload_date = db.Column(db.DateTime, nullable=False)
  views = db.Column(db.Integer, nullable=False)
  upvotes = db.Column(db.Integer, nullable=False)
  downvotes = db.Column(db.Integer, nullable=False)
  mimetype = db.Column(db.String(40), nullable=False)
  file_type = db.Column(db.String(40), nullable=False)

  comments = db.relationship('Comment', backref='file', lazy=True, cascade="all")

  def to_json(self):
    return {
      'file_id': self.file_id,
      'user_id': self.user_id,
      'title': self.title,
      'description': self.description,
      'permissions': self.permissions,
      'upload_date': self.upload_date,
      'views': self.views,
      'upvotes': self.upvotes,
      'downvotes': self.downvotes,
      'mimetype': self.mimetype,
      'file_type': self.file_type
    }

  def __repr__(self):
    return '<File {id} [{owner}]>'.format(id=self.file_id,owner=self.user_id)

class Category(db.Model):
  __tablename__ = 'Category'

  def __init__(self, category):
    self.category = category

  category_id = db.Column(db.Integer, primary_key=True)
  category = db.Column(db.String(40), nullable=False)
  files = db.relationship('File', secondary=files_categories, lazy='dynamic', backref=db.backref('categories', lazy='dynamic'), cascade="all")

  def to_json(self):
    return {
      'category_id': self.category_id,
      'category': self.category,
    }

  def __repr__(self):
    return '<Category {id} [{category}]>'.format(id=self.category_id,name=self.category)

class Keyword(db.Model):
  __tablename__ = 'Keyword'

  def __init__(self, keyword):
    self.keyword = keyword

  keyword_id = db.Column(db.Integer, primary_key=True)
  keyword = db.Column(db.String(40), nullable=False)
  files = db.relationship('File', secondary=files_keywords, lazy='dynamic', backref=db.backref('keywords', lazy='dynamic'), cascade="all")

  def to_json(self):
    return {
      'keyword_id': self.keyword_id,
      'keyword': self.keyword,
    }

  def __repr__(self):
    return '<Keyword {id} [{keyword}]>'.format(id=self.keyword_id,name=self.keyword)

class Comment(db.Model):
  __tablename__ = 'Comment'

  def __init__(self, user_id, file_id, comment, comment_date):
    self.user_id = user_id
    self.file_id = file_id
    self.comment = comment
    self.comment_date = comment_date

  comment_id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('User.user_id',ondelete="CASCADE"), nullable=False)
  file_id = db.Column(db.Integer, db.ForeignKey('File.file_id',ondelete="CASCADE"), nullable=False)
  comment = db.Column(db.String(40), nullable=False)
  comment_date = db.Column(db.DateTime, nullable=False)

  def to_json(self):
    return {
      'comment_id': self.comment_id,
      'user_id': self.user_id,
      'file_id': self.file_id,
      'comment': self.comment,
      'comment_date': self.comment_date
    }

  def __repr__(self):
    return '<Comment {id} [{owner}]>'.format(id=self.comment_id,owner=self.user_id)

class Message(db.Model):
  __tablename__ = 'Message'

  def __init__(self, contacting_id, contacted_id, message, message_date):
    self.contacting_id = contacting_id
    self.contacted_id = contacted_id
    self.message = message
    self.message_date = message_date

  message_id = db.Column(db.Integer, primary_key=True)
  contacting_id = db.Column(db.Integer, db.ForeignKey('contacts.contacting_id', ondelete="CASCADE"), nullable=False)
  contacted_id = db.Column(db.Integer, db.ForeignKey('contacts.contacted_id', ondelete="CASCADE"), nullable=False)
  message = db.Column(db.String(100), nullable=False)
  message_date = db.Column(db.DateTime, nullable=False)

  def to_json(self):
    return {
      'message_id': self.message_id,
      'contacting_id': self.contacting_id,
      'contacted_id': self.contacted_id,
      'message': self.message,
      'message_date': self.message_date
    }

  def __repr__(self):
    return '<Message {id} [{message}]>'.format(id=self.message_id,name=self.message)
