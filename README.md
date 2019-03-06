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
### Server
1. Create a database in Buffet
   - Note your username, password, database name, and host name
2. Clone the repo then open it in terminal
   ```
   cd path/MeTube
   ```
3. Go to the server directory
   ```
   cd server/server
   ```
4. Edit the file named '.env' with the following and fill in the `<variables>` with your buffet database info
   - the host, port, and dialect probably do not need to be changed
   ```
   DB_USER=<username>
   DB_PASS=<password>
   DB_HOST=mysql1.cs.clemson.edu
   DB_PORT=3306
   DB_NAME=<database-name>
   DB_DIALECT=mysql
   ```
   - Your current directory should now have a `.env` and `.flaskenv` in it
5. Run the server using:
   ```
   python3 server.py
   ```
   - or
   ```
   flask run
   ```
6. Open your browser to the link on the line 'Running on ...' to determine if it is up
   - e.g. localhost:5000
### Client
1. Install node, using a package manager is recommended. See https://nodejs.org/en/download/package-manager/
   - nvm is good
2. Go to the client directory
   ```
   cd client
   ```
3. Load node if needed and install dependencies using npm, the package manager included with node. This may take some time.
   ```
   npm install
   ```
4. Edit the file named '.env' with the following and fill in the `<variables>` as desired
   ```
   REACT_APP_ROOT_DIR=/~<your_Clemson_username>
   ```
5. Run the client
   ```
   npm start
   ```
6. Open your browser to the link on the line 'Local: ...'
   - e.g. localhost:3000

## Testing
Tests on the server are run using a Postman collection in the tests folder.
1. Open Postman and click Import
2. Import the Postman collection file in the tests folder.
3. After making changes to the collection, export it and overwrite the file.
(Users will need to add the source path for BobFile1.txt to the json test file in order to pass all tests.)

## Publishing
The web app is hosted on http://webapp.cs.clemson.edu/~username
### Client
1. Go to the client
   ```
   cd client
   ```
2. Edit package.json `homepage` replacing `<username>` with your Clemson username
   ```
   "homepage": "http://webapp.cs.clemson.edu:3000/~<username>"
   ```
3. Build static pages for the front end
   ```
   npm run build
   ```
4. Push the new static pages to the web app server
   - WARNING: npm run push will overwrite files in your public_html folder
   - Use the second command to specify your own path
   ```
   npm run push
   ```
   - or
   ```
   rsync -av build/ webapp.cs.clemson.edu:~/<your_path>
   ```
5. Navigate to `http://webapp.cs.clemson.edu/~<your_Clemson_username>/` to see the app
   - This is a static website
   - Not using server-side rendering, so node is not used to keep it running

## Notes


## TODO
- Improve server and client authentication to use tokens
  - See https://stackoverflow.com/questions/49819183/react-what-is-the-best-way-to-handle-authenticated-logged-in-state
  - See https://flask-httpauth.readthedocs.io/en/latest/
- Add filter_sort_paginate feature to all get_* routes
- Add server video stream route and headers
  - See https://medium.com/@daspinola/video-stream-with-node-js-and-html5-320b3191a6b6
  - https://stackoverflow.com/questions/24976123/streaming-a-video-file-to-an-html5-video-player-with-node-js-so-that-the-video-c
- Add thumbnail extraction, both for video seek preview and file preview image
  - Note: I think docs do not need to be supported
  - 360x640px (mobile full-width) and 216x384px (widescreen grid list) or close should be good
  - maybe store in file_store/thumbnails directory
  - maybe name pattern `<name>.<ext>` and `<name>_mobile.<ext>`
  - for images and docs, see https://github.com/algoo/preview-generator
  - for videos, see https://github.com/algoo/preview-generator/issues/27
    - https://github.com/flavioribeiro/video-thumbnail-generator
    - https://tailsu.github.io/2016/07/11/generate-video-thumbnail-with-ffmpeg-and-python.html
    - https://makerhacks.com/thumbnail-images-using-python/
  - for audio? maybe user uploaded cover art
- Create default file thumbnail images for docs, imgs, videos, and audio
- Add components then build pages
  - Home page
  - File item card
  - File item display page
  - and more
