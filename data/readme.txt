* This set of scripts is used to scrape musician concert data from Last.fm API
* Performance titles, dates, venues (locations), participating artists and other data are collected.
* The script is powered by multiprocessing, requests and sqlite3 module
* The suggested way of using this script is use gbo.py to generate a local file storing all the API responses (json), then use 
  process_from_file() to parse json file and populate sqlite database.
* gbo.py is a multiprocessing approach. Its fast, but do not attempt to use it to do database insert (bad concurrency in sqlite)