import os
from flask import Flask, url_for, escape, request, session, redirect, cli, jsonify

app = Flask(__name__)

def configure_app(is_flask=False):
	prefix = 'server.config.' if is_flask else 'config.'
	configs = {
		'production': prefix+'ProductionCfg',
		'dev': prefix+'DevCfg',
		'test': prefix+'TestCfg',
		'default': prefix+'DevCfg'
	}
	cfg_name = os.getenv('SERVER_CFG') or 'default'
	app.config.from_object(configs[cfg_name])

	db.init_app(app)
	# recreate_db()

def recreate_db():
	db.drop_all(app=app)
	db.create_all(app=app)

if __name__ == "__main__":
	cli.load_dotenv()
	from db import *
	configure_app(is_flask=False)
	recreate_db()
else:
	from server.db import *
	configure_app(is_flask=True)
	recreate_db()

@app.route('/')
def index():
	# if 'username' in session:
	# 	return 'Hello %s' % escape(session['username'])
	users = User.query
	if users:
		return jsonify([user.to_json() for user in users.all()])
		# return jsonify([{'user_id':user.user_id,'username':user.username} for user in users.all()])
	return 'The index page'

# def valid_login(uname, pword):
# 	if uname and pword:
# 		return True
# 	return False
# 	# if(user_exists(uname)):
# 	#  if(auth_user(uname, pword)):
# 	#    return true

# def log_in_user(uname, pword):
# 	session['username'] = uname
# 	return redirect(url_for('index'))

# @app.route('/logout')
# def log_out():
# 	session.pop('username',None)
# 	return redirect(url_for('index'))


# @app.route('/login',methods=['POST'])
# def login():
# 	error = None
# 	username, password = request.form
# 	if valid_login(username, password):
# 		return log_in_user(username, password)
# 	else:
# 		error = 'Invalid username or password'
# 	return error

# @app.route('/users')
# def get_users():
# 	#sortKey = request.args.get('sortby','')
# 	return

# @app.route('/usersNum')
# def num_users():
# 	return 5

@app.route('/users/<username>')
def get_user(username):
	newUser = User(username)
	db.session.add(newUser)
	db.session.commit()
	return 'User %s' % username

@app.route('/files/<userid>')
def get_file(userid):
	newFile = File(userid)
	db.session.add(newFile)
	db.session.commit()
	return 'File owner %s' % userid



if __name__ == "__main__":
	app.run()
