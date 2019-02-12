from os import path
from json import JSONEncoder
from flask_sqlalchemy import SQLAlchemy
from passlib.hash import pbkdf2_sha256

db = SQLAlchemy()

class User(db.Model):
  __tablename__ = 'User'

  def __init__(self, email='', username='', password='', chan_des=''):
    self.email = email
    self.username = username
    self.password_hash = self.hash_password(password)
    self.channel_description = chan_des

  user_id = db.Column(db.Integer, primary_key=True)
  # max email length discussion: https://7php.com/the-maximum-length-limit-of-an-email-address-is-254-not-320/
  email = db.Column(db.String(320), nullable=False)
  username = db.Column(db.String(40), unique=True, nullable=False)
  password_hash = db.Column(db.String(128), nullable=False)
  channel_description = db.Column(db.String(400), nullable=True)

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

#TODO: test File upload with invalid user_id
class File(db.Model):
  __tablename__ = 'File'

  def __init__(self, user_id, realname, dest, filename, mimetype):
    self.user_id = user_id
    self.realname = realname
    self.path = path.join(dest,realname)
    # metadata
    self.filename = filename
    self.mimetype = mimetype
  file_id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('User.user_id'), nullable=False)
  realname = db.Column(db.String(100), unique=True, nullable=False)
  path = db.Column(db.String(250), unique=True, nullable=False)
  # metadata
  filename = db.Column(db.String(100), nullable=False)
  mimetype = db.Column(db.String(16), nullable=False)

  def to_json(self):
    return {
      'file_id': self.file_id,
      'user_id': self.user_id
    }
  
  def __repr__(self):
    return '<File {id} [{owner}]>'.format(id=self.file_id,owner=self.user_id)

class Playlist(db.Model):
  __tablename__ = 'Playlist'

  def __init__(self, user_id):
    self.user_id = user_id
  playlist_id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('User.user_id'), nullable=False)
  # metadata

  def to_json(self):
    return {
      'playlist_id': self.playlist_id,
      'user_id': self.user_id
    }
  
  def __repr__(self):
    return '<Playlist {id} [{owner}]>'.format(id=self.playlist_id,owner=self.user_id)


