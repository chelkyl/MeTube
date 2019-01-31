# MeTube

## Dependencies
Confirmed packages and versions:
- Python 3.5.2
- Flask 1.0.2
  - Flask-sqlalchemy 2.3.2
  - PyMySQL 0.9.3

## Setup
0. Create a database in Buffet
-- Note your username, password, database name, and host name
1. Clone the repo then open it in terminal
    cd path/MeTube
2. Go to the server
    cd server/server
3. Create a file named '.env' with the following and fill in the `<variables>`
-- the host, port, and dialect probably don't need to be changed
    DB_USER=<username>
    DB_PASS=<password>
    DB_HOST=mysql1.cs.clemson.edu
    DB_PORT=3306
    DB_NAME=<database-name>
    DB_DIALECT=mysql
-- Your current directory should now have a `.env` and `.flaskenv` in it
4. WARNING: this step may not be safe, see Notes section below
-- Run the server using:
    python server.py
-- or
    flask run
5. Open the browser to the link on the line 'Running on ...'
-- e.g. 127.0.0.1:5000

## Notes
The server currently recreates the database from scratch every time.
Supported routes:
    /users/<name> - creates a new entry in table User with username of name
    /files/<user_id> - creates a new entry in table File referencing user with user_id
    / - returns json representation of entries in table User

