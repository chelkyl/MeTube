from json import JSONEncoder
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# create table User (
#   user_id int not null,
#   username varchar(40) not null,
#   primary key (user_id),
#   unique key (username)
# );
class User(db.Model):
  __tablename__ = 'User'

  def __init__(self, username=''):
    self.username = username
  user_id = db.Column(db.Integer, primary_key=True)
  username = db.Column(db.String(40), unique=True, nullable=False)
  # # metadata
  # files = db.relationship('File',backref='user', lazy=True)
  # playlists = db.relationship('Playlist',backref='user', lazy=True)

  def to_json(self):
    return {
      'user_id': self.user_id,
      'username': self.username
    }

  def __repr__(self):
    return '<User {id} [{name}]>'.format(id=self.user_id,name=self.username)

class File(db.Model):
  __tablename__ = 'File'

  def __init__(self, user_id):
    self.user_id = user_id
  file_id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('User.user_id'), nullable=False)
  # metadata

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


