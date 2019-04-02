import os
from pathlib import Path

class Config(object):
  DEBUG = False
  TESTING = False
  SERVE_PUBLIC = False
  SECRET_KEY = "SUCHENCRYPTSOPROTECT"
  DEFAULT_SESSION_LENGTH_HRS = 24

  MAX_CONTENT_LENGTH = 1024 * 1024 * 512   # 512 megabytes
  UPLOAD_DIR = os.getenv('UPLOAD_DIR') or None
  assert (UPLOAD_DIR != None), 'Missing UPLOAD_DIR env var, check your .flaskenv file'
  Path(UPLOAD_DIR).mkdir(parents=True,exist_ok=True)
  DIALECT  = os.getenv('DB_DIALECT') or None
  USERNAME = os.getenv('DB_USER') or None
  PASSWORD = os.getenv('DB_PASS') or None
  HOST     = os.getenv('DB_HOST') or None
  PORT     = os.getenv('DB_PORT') or None
  DB_NAME  = os.getenv('DB_NAME') or None
  assert (DIALECT != None),  'Missing DB_DIALECT env var, check your .env file'
  assert (USERNAME != None), 'Missing DB_USER env var, check your .env file'
  assert (PASSWORD != None), 'Missing DB_PASS env var, check your .env file'
  assert (HOST != None),     'Missing DB_HOST env var, check your .env file'
  assert (PORT != None),     'Missing DB_PORT env var, check your .env file'
  assert (DB_NAME != None),  'Missing DB_NAME env var, check your .env file'
  SQLALCHEMY_DATABASE_URI = '{L}+pymysql://{U}:{S}@{H}:{P}/{D}'.format(L=DIALECT,U=USERNAME,S=PASSWORD,H=HOST,P=PORT,D=DB_NAME)
  SQLALCHEMY_TRACK_MODIFICATIONS = False
  SQLALCHEMY_POOL_TIMEOUT = 5    # in seconds
  SQLALCHEMY_POOL_RECYCLE = 600  # in seconds

class ProductionCfg(Config):
  SERVE_PUBLIC = True

class DevCfg(Config):
  DEBUG = True
  # shows sqlalchemy engine statements
  # SQLALCHEMY_ECHO = True

class TestCfg(Config):
  TESTING = True
  SQLALCHEMY_ECHO = False
