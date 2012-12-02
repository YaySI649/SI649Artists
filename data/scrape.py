import requests
import string
import simplejson as json
from datetime import datetime
import os
import sqlite3 as lite
import sys

# API KEYS
api_will = '94783d2569b7898cdda03fde34f2b07e'
api_shuo = '8ebd505e0a03bccc43e1cafbd15a6b06'

# Util method to get ground encoding
def filt(myStr):
    filtered_string = filter(lambda x: x in string.printable, myStr)
    return str(filtered_string)

def process_event_json(event,artist=''):
    """
    Main Function to process the api json response (artist:pastEvents)
    iterate through all events included and update database
    parameter: string json and artist(if not given, parse from json)
    """
    if len(event)==0:
        return
    try:
        jsonObj = json.loads(filt(event))
    except Exception,e:
        log_error("Cant Load JSON for artist: %s\t%s"%(artist,str(e)))
        return
    #Get DB connection
    connection = setup_db()  
    #if artist not given, try to parse it from json
    if len(artist) == 0:
        try:
            artist = jsonObj['events']['@attr']['artist'].replace('\"','')
            print artist
        except:
            print "Can't find event artist"   
    #Get events
    try:
        events = jsonObj['events']['event']
    except KeyError:
        log_error("no events for artist:%s "%artist)
        return
    #Get Cursor, prepare bulk insert
    cur = connection.cursor()
    insert_count = 0
    #lists(iterator) to store bulk values
    events_list = []
    venue_list = []
    relation_list = []

    for event in events:
        #Event info
        id = int(event['id'])
        title = event['title'].replace('\"','')
        #Event date - datetime standard
        start_date = str(datetime.strptime(event['startDate'],"%a, %d %b %Y %H:%M:%S"))
        #Other event info
        description = event['description'].replace('\"','')
        attendance = event['attendance']
        reviews = event['reviews']
        url = event['url']
        cancelled = event['cancelled']
        tag = event['tag']
        website = event['website']
        image = event['image'][2]['#text']
        #venue info
        #really few events do not have venue...
        try:
            venue_id = int(event['venue']['id'])
        except KeyError:
            continue
        venue_name = event['venue']['name'].replace('\"','')
        venue_url = event['venue']['url']
        venue_website = event['venue']['website']
        venue_phone = event['venue']['phonenumber']
        venue_city = event['venue']['location']['city'].replace('\"','')
        venue_country = event['venue']['location']['country'].replace('\"','')
        venue_street = event['venue']['location']['street'].replace('\"','')
        venue_postal = event['venue']['location']['postalcode']
        try:
            venue_lat = float(filt(event['venue']['location']['geo:point']['geo:lat']))
            venue_long = float(filt(event['venue']['location']['geo:point']['geo:long']))
        except ValueError:
            #No valid lat long
            venue_lat = 999
            venue_long = 999
        #artists info
        artists_headliner = event['artists']['headliner'].replace('\"','')
        artists_all = event['artists']['artist']
        
        """
        #single transaction insert - SLOW!! DEPRECATED
        insert_event(id, title, start_date, artists_headliner, 
                     venue_id, description, image, attendance, 
                     reviews, tag, url, website, cancelled, cur)
        insert_venue(venue_id, venue_name, venue_url, venue_website, 
                     venue_phone, venue_city, venue_country, venue_street, 
                     venue_postal, venue_lat, venue_long, cur)
        """
        
        # Append event value table (check for overlaps)     
        cur.execute("select * from EVENTS where id=%d"%id)
        event_tup = (id, title, start_date, artists_headliner, 
                     venue_id, description, image, attendance, 
                     reviews, tag, url, website, cancelled)
        if (len(cur.fetchall())==0 and event_tup not in events_list):
            insert_count += 1
            events_list.append(event_tup)
        
        # Append venue value table        
        cur.execute("select * from VENUES where id=%d"%venue_id)
        venue_tup = (venue_id, venue_name, venue_url, venue_website, 
                     venue_phone, venue_city, venue_country, venue_street, 
                     venue_postal, venue_lat, venue_long)
        if (len(cur.fetchall())==0 and venue_tup not in venue_list):
            insert_count += 1
            venue_list.append(venue_tup)
        
        # Append event-artist relation table
        
        for person in artists_all:
            #print "\t"+person
            artist_str = person.replace('\"', '')
            if len(artist_str)>1:
                """
                #single transaction insert, DEPRECATED
                #insert_event_artists(int(id), artist_str, cur)
                """
                #cur.execute("select * from EVENT_ARTIST where event_id=%d \
                #            and artist_name=\"%s\""%(int(id),artist_str))
                #Note we only need to check whether a event exist
                #no need to check if each relation tupple exists
                cur.execute("select * from EVENTS where id=%d"%id)
                if (len(cur.fetchall())==0 and 
                    (int(id), artist_str) not in relation_list):
                    insert_count += 1
                    relation_list.append((int(id), artist_str))
               
        
    #wrap up bulk insert and commit
    print "start inserting"
    cur.executemany("insert into EVENTS values (?,?,?,?,?,?,?,?,?,?,?,?,?)",events_list)
    cur.executemany("insert into VENUES values (?,?,?,?,?,?,?,?,?,?,?)",venue_list)
    cur.executemany("insert into EVENT_ARTIST values (?,?)",relation_list)
    connection.commit()
    connection.close()
    print "insert compelete"
    print "Inserted:\t%s\t%d rows"%(artist, insert_count)
    with open('artists_log.txt','a') as h: 
        h.write("Inserted:\t%s\t%d rows\n"%(artist, insert_count)) 
    
def process_artist_json(artist_json,artist=''):
    """
    Main Function to process the api json response for artist info (artist:getinfo)
    parameter: string artist info json and artist(if not given, parse from json)
    """
    if len(artist_json)==0:
        return
    try:
        jsonObj = json.loads(filt(artist_json))
    except Exception,e:
        log_error("Cant Load JSON for artist: %s\t%s"%(artist,str(e)))
        return
    #Get DB connection
    connection = setup_db()  
    connection.text_factory = str
    #if artist not given, try to parse it from json
    if len(artist) == 0:
        try:
            artist = jsonObj['artist']['name'].replace('\"','')
            print artist
        except:
            print "Can't find event artist"   

    #Get Cursor, prepare bulk insert
    cur = connection.cursor()
    insert_count = 0
    
    mbid = jsonObj['artist']['mbid']
    listener_count = int(jsonObj['artist']['stats']['listeners'])
    playcount = int(jsonObj['artist']['stats']['playcount'])
    bio = jsonObj['artist']['bio']['content']
    
    
    cur.execute("select * from ARTISTS where name=\"%s\""%artist)
    if (len(cur.fetchall())==0):
        insert_count += 1
        try:
            cur.execute("insert into ARTISTS values (?,?,?,?,?,?)",
                    (artist, "GENGE", mbid, listener_count, playcount,bio))
        except Exception, e:
            log_error("Failed to insert artist:\t%s\t%s"%(artist,str(e)))
            print ("Failed to insert artist:\t%s\t%s"%(artist,str(e)))
            connection.close()
            return
        tags = []
        try:
            for tag in jsonObj['artist']['tags']['tag']:
                tags.append((artist, tag['name']))
                insert_count += 1
        except Exception,e:
                log_error("Failed to insert tags for artist:\t%s\t%s"%(artist,str(e)))
                print ("Failed to insert tags for artist:\t%s\t%s"%(artist,str(e)))
        cur.executemany("insert into ARTISTS_TAG values (?,?)",tags)
    
    connection.commit()
    connection.close()
    print "insert compelete"
    print "Inserted:\t%s\t%d rows"%(artist, insert_count)
    with open('artists_log.txt','a') as h: 
        h.write("Inserted:\t%s\t%d rows\n"%(artist, insert_count)) 

def query_api(artist):
    """
    query api for the artist, then handle response (parse and insert DB)
    Parameter: artist
    # Recommend downloading response to local file first instead of using this
    # please refer to get_json_file() and process_from_file()
    """
    print "########################\nProcessing: %s"%artist
    with open('artists_log.txt','a') as h: h.write("downloading:\t"+artist+"\n")
    
    #request URL and params
    url = 'http://ws.audioscrobbler.com/2.0/?method=artist.getpastevents';
    params = {'artist':artist,'limit':999999,'format':'json',
            'api_key':api_will}
    #try connection and log timeouts
    try:
        print "\t-%s:\tDownloading from API"%artist
        r = requests.get(url,params=params,timeout=5)
        print "\t-%s:\tDownload complete"%artist
    except Exception,e:
        print 'API QUERY ERROR for artist :%s:%s\n'%(artist,e)
        log_error('API QUERY ERROR for artist :%s:%s\n'%(artist,e))
        return
    #get json string handle respons (insert db)
    json_string = filt(r.text)
    process_event_json(json_string,artist)
    print "########################\nProcess Complete: %s"%artist
    with open('artists_log.txt','a') as h: h.write("complete:\t"+artist+"\n")

    
def setup_db(overwrite=0):
    """
    Utility method to setup db, tables, purge and get connection
    parameter: override
    return: connection
    # override = 1 will delete (if exists) and create db, create tables, and return connection
    # override = 0 (do not creates new db) gets connection normally    
    """
    con = None
    if overwrite == 1:
        try:
            os.remove('lastfmDB.db')
            print "override db"
        except:
            print "creating new db"
        con = lite.connect('lastfmDB.db', timeout=5)
        create_table(con)  
    elif overwrite == 0:
        con = lite.connect('lastfmDB.db', timeout=5)  
    else:
        print "error preparing database"
    return con

# Method to create table
def create_table(con): 
    """
    create table
    """
    cur = con.cursor()
    # Create event table
    cur.execute("CREATE TABLE EVENTS(id NOT NULL PRIMARY KEY,title TEXT, " \
                "start_date TEXT, headline_artist TEXT, venue_id INTEGER,"+
                "description TEXT, image TEXT, attendance TEXT, reviews TEXT, " \
                "tag TEXT, url TEXT, website TEXT, cancelled TEXT)")
    # Create venue table
    cur.execute("CREATE TABLE VENUES(id NOT NULL PRIMARY KEY,name TEXT, url TEXT, " \
                "website TEXT, phone TEXT, city TEXT, country TEXT, street TEXT, "\
                "postal TEXT, lat DOUBLE, long DOUBLE)")
    # Create artists table
    cur.execute("CREATE TABLE ARTISTS(name TEXT, genre TEXT," \
                "mbid TEXT, listener INTEGER, playcount INTEGER, bio TEXT)")
    # Create event-artists relationship table
    cur.execute("CREATE TABLE EVENT_ARTIST(event_id INTEGER,artist_name TEXT)")
    # Create artists tag table
    cur.execute("CREATE TABLE ARTISTS_TAG(artist_name TEXT, tag TEXT)")
    
    con.commit()


# Error log util method
def log_error(message):
    with open('error_log.txt','a') as h: h.write(message+'\n')

# Success log util method
def log_success(message):
    with open('success_log.txt','a') as h: h.write(message+'\n')
  
       
##############################################
## Methods using local file
##############################################

def get_json_file(query_type='events'):
    """
    Process artist and start queries
    parameter: query_type (default 'events' or 'artist') 
    """
    h = open('ArtistsGenres.csv','rb')
    for line in h:
        artist = line.strip().split(',')[0]
        print "Download data for artist:\t%s"%artist
        try:
            write_json_for_artist(artist, query_type)
        except Exception,e:
            print "error processing %s: "%artist
            print e
            log_error("error processing %s: %s"%(artist, str(e)))
 
def update_genre():
    """
    Process artist and start queries
    parameter: query_type (default 'events' or 'artist') 
    """
    h = open('ArtistsGenres.csv','rb')
    connection = setup_db()
    connection.text_factory = str
    cur = connection.cursor()
    for line in h:
        (artist, genre) = line.strip().split(',')
        print "update genre data for artist:\t%s"%artist
        cur.execute("update ARTISTS set genre = ? where name = ? and genre=\"GENRE\"", (genre, artist))
        '''
        try:
            write_json_for_artist(artist, query_type)
        except Exception,e:
            print "error processing %s: "%artist
            print e
            log_error("error processing %s: %s"%(artist, str(e)))
            '''
    connection.commit()
    connection.close()
         
def write_json_for_artist(artist, query_type='events'):
    """
    query api and write response to a local json file  
    parameter: artist, query_type (default 'events' or 'artist')
    """
    if query_type == 'events':
        #url = 'http://ws.audioscrobbler.com/2.0/?method=artist.getpastevents'
        #params = {'artist':artist,'limit':999999,'format':'json',
        #    'api_key':api_shuo}
        url = "http://ws.audioscrobbler.com/2.0/?method=artist.getpastevents\
            &api_key=%s&format=json&limit=999999&artist=%s"%(api_shuo, artist)
        
    elif query_type == 'artist':
        url = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo'
        params = {'artist':artist, 'format':'json','api_key':api_shuo}
    else:
        print 'parameter mistake'
        return
    try:
        r = requests.get(url,params=params,timeout=5)
        print r.url
        json_string = filt(r.text).strip()
        if query_type == 'events':
            with open('events_json.txt','a') as h: h.write(json_string+'\n')
        elif query_type == 'artist':
            with open('artists_json.txt','a') as h: 
                h.write(artist +'\t' + json_string+'\n')
        print "Wrote json for artist:\t%s"%artist
        log_success("Wrote json for artist:\t%s"%artist)
        pass
    except Exception,e:
        print 'API QUERY ERROR:%s\n'%(e)
        log_error('API QUERY ERROR for :%s: %s\n'%(artist, e))

#Process the local json file
def process_from_file(mode='events',override_mode=0):
    """
    process event_json.txt and insert to databse
    parameter: mode: default 'events' or 'artist'
               override mode. 1 to drop old db and create new
               0 to connect existing database
    """
    con = setup_db(override_mode)
    con.close()
    if mode == 'events':
        h = open('events_json.txt','rb')
    elif mode == 'artist':
        h = open('artists_json.txt','rb')
    else:
        print "parameter error"
        return
    for line in h:
        line = line.strip()
        if len(line)>2:
            # make sure it can run through and log exceptions...
            json_str = ""
            artist_str = ""
            if mode == 'events':
                try:
                    process_event_json(line)
                except Exception,e:
                    print e
                    log_error(str(e)+':\n'+json_str)
            elif mode == 'artist':
                json_str = line.split('\t')[1]
                artist_str = line.split('\t')[0]
                process_artist_json(json_str, artist_str)
                '''
                try:
                    
                except Exception,e:
                    print e
                    log_error(artist_str + '\t' + str(e)+':\n'+json_str)
                    '''
        else:
            log_error("invalid json")
            continue
    h.close()    
    
    
# A normal way to fire the scraping and db populating
# gbo.py is a multiprocessing attempt but not safe to use
# because of sqlite weak concurrency
if __name__=="__main__":
    if len(sys.argv)<2 or (sys.argv[1] not in ['0','1']):
        print "Unrecognized parameter, usage:"
        print "run scrape 1\t|Create new DB (delete old db) and proceed"
        print "run scrape 0\t|Connect to existing db"
        sys.exit()
    if int(sys.argv[1])==0 and not (os.path.exists('lastfmDB.db')):
        print "Database does not exist, please use run scrape 1"
        sys.exit()
    con = setup_db(int(sys.argv[1]))
    con.close()
    h = open('ArtistsGenres.csv','rb')
    artists = []
    for line in h:
        artist = line.strip().split(',')[0]
        artists.append(artist)
    for artist in artists:
        try:
            query_api(artist)
        except Exception,e:
            print "error processing %s: "%artist
            print e
            log_error("error processing %s: %s"%(artist, str(e)))


###################################################
#Insert funcs (DEPRECATED and replaced by executemany)
###################################################

# Insert Event (pass in cursor)
def insert_event(id, title, start_date, headline_artist, venue_id,
                 description, image, attendance, reviews, tag,
                 url, website, cancelled, cursor):
    sql = "INSERT INTO EVENTS VALUES(\"%d\", \"%s\", \"%s\", \"%s\", \"%d\", \"%s\", \"%s\"," \
                                    "\"%s\", \"%s\", \"%s\", \"%s\", \"%s\", \"%s\")" % (id, 
                                    title, start_date,headline_artist, venue_id,description, 
                                    image, attendance, reviews,tag,url, website, cancelled)
    try:
        cursor.execute(sql)
        #print 'Inserted Event: %d\t%s'%(id,title)
        #log_success('Inserted Event: %d\t%s'%(id,title))
        pass
    except Exception, e: 
        # if already exists, not a problem
        if str(e)=='column id is not unique':
            #print "event exists: %d\t%s"%(id, title)
            #log_success("event exists: %d\t%s"%(id, title))
            pass
        else:
            # Log error instead of raise
            #print "error: %s",e
            log_error('ERROR:%s\n\t-%s'%(e,sql))

# Insert Venue (pass in cursor)
def insert_venue(id, name, url, website, phone, city, country, 
                 street, postal, lat, long, cursor):
    sql = "INSERT INTO VENUES VALUES(\"%d\", \"%s\", \"%s\", \"%s\", \"%s\", \"%s\"," \
                                    "\"%s\", \"%s\", \"%s\", \"%f\", \"%f\")" % (id, 
                                    name, url, website, phone, city, country, 
                                    street, postal, lat, long)
    try:
        cursor.execute(sql)
        #print 'Inserted Venue: %d\t%s'%(id,name)
        #log_success('Inserted Venue: %d\t%s'%(id,name))
        pass
    except Exception, e: 
        if str(e)=='column id is not unique':  
            #print "Venue exists: %d\t%s"%(id, name)
            #log_success("Venue exists: %d\t%s"%(id, name))
            pass
        else: 
            #print "error: %s",e
            log_error('ERROR:%s\n\t-%s'%(e,sql))
  
# Insert event-artist relation (pass in connection)
def insert_event_artists(event_id, artist_name,cursor):
    sql = "INSERT INTO EVENT_ARTIST VALUES(\"%d\",\"%s\")" % (event_id,artist_name)    
    # No pk here to deal with non-uniqu - do a query first
    unique = 0
    try:
        cursor.execute('SELECT * FROM EVENT_ARTIST WHERE event_id=%d and artist_name=\"%s\"'%(event_id,artist_name))
    except:
        #import ipdb; ipdb.set_trace(0)
        print "error:%s"%artist_name
    for line in cursor:
        unique+=1
    if unique > 0:
        #print "relation already exists: %d - %s"%(event_id,artist_name)
        #log_success("relation already exists: %d - %s"%(event_id,artist_name))
        pass
    # Unique: Proceed to insert
    else:
        try:
            cursor.execute(sql)
            #print 'Inserted event-artist relation: %d - %s'%(event_id,artist_name)
            #log_success('Inserted event-artist relation: %d - %s'%(event_id,artist_name))
            pass
        except Exception, e: 
            #print "error: %s",e
            log_error('ERROR:%s\n\t-%s'%(e,sql))

