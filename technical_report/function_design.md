# MeTube Function Design

##Requirements
##Objectives
##Design Change Request --dont think we need this--

##Functional Specifications


###server
our server is split into 13 modules written in Python3
each module handles request and responses to specific file and database
queries

####db.py
1. uses SQLAlchemy to generate a database for the Website
2. provides helper functions for authentication that will be used later

####auth.py
1. provides a route for clients for User authentication by verifying hashed
passwords in the database
2. provides a route for clients to retrieve the administrators in the database
3. provides a route for clients that validates users login request as well as
validates current users authentication status while browsing the site
####categories.py
1. provides a route for clients to get file data from all categories in the
database
2. provides a route for clients to get file data from files in a single category
3. provides a route for clients to set the category of a uploaded files
4. provides a route for clients to delete category information for a file
5. provides a route for clients to edit the category of an existing file
6. provides a route for clients to remove the category of an existing file

####comments.py
1. provides a route for clients to get the comments associated with a file
2. provides a route for clients to add comments to a specified file
3. provides a route for clients to delete a comment from associated file

####keywords.py
1. provides a route for clients to get all keywords in the database
2. provides a route for clients to get a keyword by its keyword id
3. provides a route for clients to add keywords to the database when a file is
uploaded
4. provides a route for clients to delete a keyword by its keyword id
5. provides a route for clients to add keywords to an associated file in the
database
6. provides a route for clients to delete a keyword by its file and keyword ids

####messages.py
1. provides a route for clients to get user messages between users
2. provides a route for clients to update or add messages between
users

####playlist.py
1. provides a route for clients to get all playlists for an associated users
2. provides a route for clients to get a specific playlist by playlist id
3. provides a route for clients to get the files associated with a playlist
by playlist id
4. provides a route for clients to create a playlist
5. provides a route for clients to edit an existing playlist
6. provides a route for clients to delete an existing playlist
7. provides a route for clients to link an existing file to an existing playlist
8. provides a route for clients to unlink a file from an existing playlist

####files.py
1. provides a route for clients to get file information of all files in the
database
2. provides a route for clients to get a specific file by file id
3. provides a route for clients to get a specific files data by file id
4. provides a route for clients to upload a file with meta-data
5. provides a route for clients to edit a files meta-data
6. provides a route for clients to delete a file from the database
####response.py
1. provides helper functions for sending and receiving http request
####server.py
1. provides helper functions for creating and deleting the database
2. registers the other files to be used by the clients
3. provides a route for administrators to delete the database
####user.py
1. provides a route for clients to get all the users in the database
2. provides a route for clients to get a specific users information
3. provides a route for clients to add a user to the database
4. provides a route for clients to edit a users information
5. provides a route for clients to delete a user from the database
6. provides a route for clients to get a users contact lists
7. provides a route for clients to unsubscribe from an other users account
8. provides a route for clients to get all subscribers of a specific user
9. provides a route for clients to add a user to a friend
10. provides a route for clients to add a user to a unfriend
11. provides a route for a clients to block a specified user
12. provides a route for clients to unblock a specified user
13. provides a route for clients to get a users favorites list
14. provides a route for clients to link a favorites list of a user
15. provides a route for clients to unlnk a favorites list of a user

####utils.py
1. sets the parameters for filtering search results
####config.py
1. sets the database variables to access a database


###client
####user account
1. Registration -
2. Sign In -
3. Profile update -
####Data Sharing
4. Upload -
5. Meta data input -
6. Download/View -
####Media Organization
7. Browse by category -
8. Channel -
9. Playlist -
10. Favorite lists -
####User interaction
11. Messaging -
12. Commenting -
####Search
13. Keywords-based search -
####others
14. --
