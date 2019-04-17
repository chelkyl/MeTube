# MeTube Function Design

##server
our server is split into 13 modules written in Python3
each module handles request and responses to specific file and database
queries

###db.py
1. uses SQLAlchemy to generate a database for the Website
2. provides helper functions for authentication that will be used later

###auth.py
1. provides a route for clients for User authentication by verifying hashed
passwords in the database
2. provides a route for clients to retrieve the administrators in the database
3. provides a route for clients that validates users login request as well as
validates current users authentication status while browsing the site
###categories.py
1. provides a route for clients to get file data from all categories in the
database
2. provides a route for clients to get file data from files in a single category
3. provides a route for clients to set the category of a uploaded files
4. provides a route for clients to delete category information for a file
5. provides a route for clients to edit the category of an existing file
6. provides a route for clients to remove the category of an existing file

###comments.py
1. provides a route for clients to get the comments associated with a file
2. provides a route for clients to add comments to a specified file
3. provides a route for clients to delete a comment from associated file

###keywords.py
1. provides a route for clients to get all keywords in the database
2. provides a route for clients to get a keyword by its keyword id
3. provides a route for clients to add keywords to the database when a file is
uploaded
4. provides a route for clients to delete a keyword by its keyword id
5. provides a route for clients to add keywords to an associated file in the
database
6. provides a route for clients to delete a keyword by its file and keyword ids
###messages.py
1. provides a route for clients to get user messages between users
2. provides a route for clients to update or add messages between
users
###playlist.py
1. provides a route for clients to get all playlist for an associated users
2. provides a route for clients to get a specific playlist by playlist id
3. provides a route for clients to 
###files.py
###response.py
###server.py
###user.py
###utils.py
###config.py

##client
