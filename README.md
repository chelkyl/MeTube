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
4. Copy the file named '.env.template' and rename as '.env' then fill in the `<variables>` with your buffet database info
   - the host, port, and dialect probably do not need to be changed
   ```
   DB_USER=<username>
   DB_PASS=<password>
   DB_HOST=mysql1.cs.clemson.edu
   DB_PORT=3306
   DB_NAME=<database-name>
   DB_DIALECT=mysql
   ```
   - Your current directory should now have `.env.template`, `.env`, and `.flaskenv` in it
5. Run the server using:
   ```
   python3 server.py
   ```
   - or
   ```
   flask run
   ```
6. Open your browser to the link on the line 'Running on ...' to determine if it is accessible
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
4. Copy the file named '.env.template' and rename as '.env' then fill in the `<variables>` as desired
   ```
   REACT_APP_ROOT_DIR=/~<your_Clemson_username>
   REACT_APP_SERVER_IP=localhost:5000
   ```
   - REACT_APP_SERVER_IP should match the server
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
4. If new tests involving file uploads were created or needs modification, see [Fixing Postman File Upload Issue](#fixing-postman-file-upload-issue)
5. Run the Python script to fix the exported test collection.
   ```
   python tests/fix_tests.py
   ```
### fix_tests.py
The replaceMap structure follows the structure of the Postman collection.
```
Example with labels:
{                              - first layer, folders
  "tag": "name",               - name of field that distinguishes folders
  "tagIs": "files",            - folder name
  "path": ["item"],            - any nested keys to traverse
  "fix": [                     - to deal with an array of objects, recurse to another layer
    {                          - second layer, tests
      "tag": "name",           - name of field that distinguishes tests
      "tagIs": "POST test",    - test name
      "path": ["request","body","formdata"],
      "fix": [                 - recurse to another layer
        {                      - third layer, test details
          "tag":"key",
          "tagIs":"file",
          "replace": {         - specify all key-value pairs to replace
            "src": "{{path}}/MeTube/server/tests/BobFile1.txt"
          }
        }
      ]
    }
  ]
}
```
### Fixing Postman File Upload Issue
If you created a test using a file upload input or encountered a bug in Postman where you cannot select a file in the file input for a test:
1. Export the collection
2. Edit replaceMap in fix_tests.py to fill in the file inputs (or replace any key-value pairs)
3. Run fix_tests.py
4. Re-import the fixed collection and test it

## Publishing
The web app is hosted on http://webapp.cs.clemson.edu/~username
### Server
1. Go to the project root MeTube
2. Run the shell script copy_to_server.sh to copy (rsync) most files to the webapp server.
   ```
   . copy_to_server.sh
   ```
3. SSH to the webapp server
   ```
   ssh webapp.cs.clemson.edu
   ```
4. Install the [dependencies](#dependencies)
5. Go to the server directory
   ```
   cd MeTube/server/server
   ```
6. Edit .flaskenv on the lines with `FLASK_ENV` and `SERVER_CFG` replacing their values with `production`
7. Run the server in the background with public access. It should stay running even after you log out.
   ```
   python server.py &
   ```
  - or
   ```
   flask run --host=0.0.0.0
   ```
8. Open your browser to the webapp server to determine if the API is accessible
   - webapp.cs.clemson.edu:5000
### Client
The webapp server should allow .htaccess files and have mod_rewrite enabled.
1. Go to the client directory
   ```
   cd client
   ```
2. Edit package.json on the line with `homepage` replacing `<username>` with your Clemson username
   ```
   "homepage": "http://webapp.cs.clemson.edu:3000/~<username>"
   ```
3. Edit .env replacing `<variables>` as needed
   ` REACT_APP_ROOT_DIR should be your Clemson username
   - REACT_APP_SERVER_IP should match the server address
   - e.g. webapp.cs.clemson.edu:5000
4. Build static pages for the front end incorporating .env variables
   ```
   npm run build
   ```
5. Edit .htaccess on the line with `<username>` substituting your Clemson username
   ```
   RewriteBase /~<username>
   ```
6. Push the new static pages and .htaccess file to the web app server
   - WARNING: npm run push will overwrite files in your public_html folder
   - Use the alternate command to specify your own path
   ```
   npm run push
   ```
   - or
   ```
   cp .htaccess build/ && rsync -av build/ webapp.cs.clemson.edu:~/<your_path>
   ```
7. Navigate to `http://webapp.cs.clemson.edu/~<your_Clemson_username>/` to see the app
   - This is a static website
   - Does not use server-side rendering, so node is not needed to keep it running
   - The .htaccess file should enable page refresh and direct navigation to sub-pages

## Misc. Notes


## TODO
- Finalize server code
  - (optional) add table to track which user upvotes/downvotes which files
    - remove these columns from File table?
  - (optional) fix lines marked with #FIXME
  - Run mysqldump to get SQL commands for creating DB
    - Create ER diagram or schema from this
    - Get sqlalchemy to execute these statements rather than create_all
    - Get sqlalchemy to execute drop statements rather than drop_all
- Finish/Add components/pages
  - (optional) file view page upvotes/downvotes
    - needs a new table similar to user_playlists
  - masthead menu Options
    - options page for rename account, change email, or delete account
  - browse page
    - (is this necessary?) add categories to file upload and browse
      - users then choose specific categories to add to their files
  - (optional) implement permissions validation
  - (optional) move alert dialog out of view page into another component and expose as a context provider
    - replace appropriate error state handling
- Technical report
  - system design
  - ER diagram
  - DB schema
  - function design
  - implementation details
  - test cases
  - test results
  - user manual or instructions
- 1 Canvas submission zip file named `<team #>.zip` e.g. `G4.zip`
  - Due Thursday, April 18 midnight
  - has technical report
  - cover page
    - lists all member names and team number
- individually submit evaluation
  - Can be found on course page [here](https://people.cs.clemson.edu/~jzwang/19014620/cpsc4620.htm)
  - 1 evaluation for each teammate for 2 total
  - named as `<team #> name nameOfTeammate.doc`
    - not very clear how name should be formatted
      - delimited by space or underscore or other? 
      - Clemson username?

### Stretch Goals
- Add more sorting options
  - add tables for download and view times/tracking
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
