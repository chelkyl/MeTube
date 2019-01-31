import os

class Config(object):
  DEBUG = False
  TESTING = False
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

class ProductionCfg(Config):
  YAY = True

class DevCfg(Config):
  DEBUG = True

class TestCfg(Config):
  TESTING = True

