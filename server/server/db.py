from os import path
from json import JSONEncoder
from flask_sqlalchemy import SQLAlchemy
from passlib.hash import pbkdf2_sha256

db = SQLAlchemy()

class User(db.Model):
  __tablename__ = 'User'

  def __init__(self, username, email, password, channel_description):
    self.email = email
    self.username = username
    self.password_hash = self.hash_password(password)
    self.channel_description = channel_description

  user_id = db.Column(db.Integer, primary_key=True)
  email = db.Column(db.String(320), unique=True, nullable=False)
  username = db.Column(db.String(40), unique=True, nullable=False)
  channel_description = db.Column(db.String(100), unique=True, nullable=False)
  password_hash = db.Column(db.String(128), unique=True, nullable=False)
  playlists = db.relationship('Playlist', backref='user', lazy=True)
  files = db.relationship('File', backref='user', lazy=True)

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

  def __repr__(self):
    return '<User {id} [{name}]>'.format(id=self.user_id,name=self.username)

files = db.Table('files',
  db.Column('file_id', db.Integer, db.ForeignKey('File.file_id'), primary_key=True),
  db.Column('playlist_id', db.Integer, db.ForeignKey('Playlist.playlist_id'), primary_key=True)
)

class Playlist(db.Model):
  __tablename__ = 'Playlist'

  def __init__(self, user_id, title, description):
    self.user_id = user_id
    self.title = title
    self.description = description

  playlist_id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('User.user_id'), nullable=False)
  title = db.Column(db.String(100), unique=True, nullable=False)
  description = db.Column(db.String(1000), unique=True, nullable=False)
  files = db.relationship('File', secondary=files, lazy='subquery', backref=db.backref('playlists', lazy=True))

  def to_json(self):
    return {
      'playlist_id': self.playlist_id,
      'user_id': self.user_id,
      'title': self.title, 
      'description': self.description
    }
  
  def __repr__(self):
    return '<Playlist {id} [{owner}]>'.format(id=self.playlist_id,owner=self.user_id)

#TODO: test File upload with invalid user_id
class File(db.Model):
  __tablename__ = 'File'

  def __init__(self, user_id, title, description, permissions, upload_date, views, upvotes, downvotes, mimetype, type):
    self.user_id = user_id
    self.title = title
    self.description = description
    self.permissions = permissions
    self.upload_date = upload_date
    self.views = views
    self.upvotes = upvotes
    self.downvotes = downvotes
    self.mimetype = mimetype
    self.type = type

  file_id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('User.user_id'), nullable=False)
  title = db.Column(db.String(100), unique=True, nullable=False)
  description = db.Column(db.String(1000), unique=True, nullable=False)
  permissions = db.Column(db.String(40), nullable=False)
  upload_date = db.Column(db.Date(), nullable=False)
  views = db.Column(db.Integer, nullable=False)
  upvoates = db.Column(db.Integer, nullable=False)
  downvotes = db.Column(db.Integer, nullable=False)
  mimetype = db.Column(db.String(40), nullable=False)
  type = db.Column(db.String(40), nullable=False)

  def to_json(self):
    return {
      'file_id': self.playlist_id,
      'user_id': self.user_id,
      'title': self.title, 
      'description': self.description, 
      'permissions': self.permissions,
      'upload_date': self.upload_date,  
      'views': self.views, 
      'upvotes': self.upvotes, 
      'downvotes': self.downvotes, 
      'mimetype': self.mimetype,
      'type': self.type 
    }
  
  def __repr__(self):
    return '<File {id} [{owner}]>'.format(id=self.file_id,owner=self.user_id)

class Category(db.Model):
  __tablename__ = 'Category'

  def __init__(self, category_id, category):
    self.category = category

  category_id = db.Column(db.Integer, primary_key=True) 
  category = db.Column(db.String(40), nullable=False)

  def to_json(self):
    return {
      'category_id': self.category_id, 
      'category': self.category, 
    }

  def __repr__(self):
    return '<Category {id} [{category}]>'.format(id=self.category_id,name=self.category)
