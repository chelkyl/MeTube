# MeTube

## Dependencies
Confirmed packages and versions:
- Python 3.5.2
- Flask 1.0.2
  - Flask-sqlalchemy 2.3.2
  - PyMySQL 0.9.3
  - passlib 1.7.1
  - python-dotenv 0.10.1
  - Flask-HTTPAuth 3.2.4
  - flask-cors 3.0.7
- Node 8.11.3

Installation can be done with `pip3 install Flask Flask-sqlalchemy PyMySql passlib python-dotenv Flask-HTTPAuth flask_cors --user`

## Setup
0. Create a database in Buffet
   - Note your username, password, database name, and host name
1. Clone the repo then open it in terminal
    ```
    cd path/MeTube
    ```
2. Go to the server
    ```
    cd server/server
    ```
3. Create a file named '.env' with the following and fill in the `<variables>` with your buffet database info
   - the host, port, and dialect probably don't need to be changed
    ```
    DB_USER=<username>
    DB_PASS=<password>
    DB_HOST=mysql1.cs.clemson.edu
    DB_PORT=3306
    DB_NAME=<database-name>
    DB_DIALECT=mysql
    ```
   - Your current directory should now have a `.env` and `.flaskenv` in it
4. 
   - Run the server using:
    ```
    python3 server.py
    ```
   - or
    ```
    flask run
    ```
5. Open your browser to the link on the line 'Running on ...'
   - e.g. localhost:5000
6. Install node, using a package manager is recommended. See https://nodejs.org/en/download/package-manager/
    - nvm is good
7. Go to the client
    ```
    cd client
    ```
8. Load node if needed and install dependencies using npm, the package manager included with node. This may take some time.
    ```
    npm install
    ```
9. Run the client
    ```
    npm start
    ```
10. Open your browser to the link on the line 'Local: ...'
    - e.g. localhost:3000

## Testing
Tests on the server are run using a Postman collection in the tests folder.
1. Open Postman and click Import
2. Import the Postman collection file in the tests folder.
3. Users will need to add their own personal path to BobFile1.txt to the json file in order to pass all tests.
3. After making changes to the collection, export it and overwrite the file.

## Notes


## TODO
- Improve server and client authentication to use tokens
  - See https://stackoverflow.com/questions/49819183/react-what-is-the-best-way-to-handle-authenticated-logged-in-state
  - See https://flask-httpauth.readthedocs.io/en/latest/
- Add server routes for all tables
  - Add server video stream route and headers
  - See https://medium.com/@daspinola/video-stream-with-node-js-and-html5-320b3191a6b6
  - https://stackoverflow.com/questions/24976123/streaming-a-video-file-to-an-html5-video-player-with-node-js-so-that-the-video-c
- Add components then build pages
  - Home page
  - File item card
  - File item display page
  - and more
