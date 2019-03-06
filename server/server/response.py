from flask import jsonify

class ResponseObject():
  def __init__(self,message=None,status=200,isError=False):
    self.status = status
    self.body = {
      'response': None if isError else message,
      'error': message if isError else None
      }
    self.headers = {}

  def error(self,status=400,message=''):
    self.status = status
    self.body['error'] = message
    return self

  def response(self,obj):
    self.body['response'] = obj
    return self

  def add_header(self,obj):
    self.headers.update(obj)
    return self

  def end(self):
    return jsonify(self.body), self.status, self.headers