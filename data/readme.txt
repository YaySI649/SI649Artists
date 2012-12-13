How to have the backend set up.
1. get the sqlite database lastfDB.db in this data folder. Could get db here https://www.dropbox.com/s/v3n5mn9lj4y8opa/lastfmDB.db
2. run get_sql.py, which should give you 3 sql_artists/events/venue.js files
3. import related jquery files, plz refer to base.html
4. Importing the database_api.js file will automatically load sql files, create db, tables and populate (also add some html)
5. Then you could use query_db(sql) to query and get results in list.
6. Never need to spend time load the huge js file or populate db again:)
7. *If the tables are already created yet population run into error, you will need to manually drop all tables in developer tools and refresh. Yes, it only populates if no table pre-exists. To add new data, you will also need to manully drop tables

Files:
# get_sql.py: move your lastfmDB.db to this folder and run get_sql to spit out insert sqls in .js files
# base.html: a template to display population process
# database_api.js: database api now only contains populating methods and a simple query function

#scrape.py and gob.py (hopefully you dont need to use it):
    * This set of scripts is used to scrape musician concert data from Last.fm API
    * Performance titles, dates, venues (locations), participating artists and other data are collected.
    * The script is powered by multiprocessing, requests and sqlite3 module
    * The suggested way of using this script is use gbo.py to generate a local file storing all the API responses (json), then use process_from_file() to parse json file and populate sqlite database.
    * gbo.py is a multiprocessing approach. Its fast, but do not attempt to use it to do database insert (bad concurrency in sqlite)
    * Ask me if you attemp to use it

#get_json.py (deprecated): move your lastfmDB.db to this folder and run get_json to spit out .js files
