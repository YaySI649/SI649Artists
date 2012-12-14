import sqlite3 as lite
import simplejson as json
import unicodedata
con = lite.connect("lastfmDB.db")
cur = con.cursor()

 

def dump_venues():
    i = 1
    sql_list = []
    sql = ""
    rows = cur.execute("select * from VENUES").fetchall()
    print len(rows)
    for row in rows:
        (id, name), website, (city, country, street, postal, lat, long) = \
                                                    row[0:2], row[3], row[5:11]
        #name = name.encode('unicode-escape')
        #city = city.encode('unicode-escape')
        #street = street.encode('unicode-escape')
        #country = country.encode('unicode-escape')
        #postal = postal.encode('unicode-escape')
        #website = website.encode('unicode-escape')
        if i==1 or i%320 == 1:
            sql = """INSERT INTO VENUES select %d as venue_id, \\"%s\\" as name, \\"%s\\" as city, \\"%s\\" as country, \\"%s\\" as street, \\"%s\\" as postal,%g as lat, %g as long, \\"%s\\" as website """% (id, name, city, postal, country, street, lat, long, website)
        else:
            sql += """UNION SELECT %d, \\"%s\\", \\"%s\\", \\"%s\\", \\"%s\\", \\"%s\\", \\"%g\\", \\"%g\\",\\"%s\\" """%(id, name, city, postal, country, street, lat, long, website)
        if i%320==0 or i == (len(rows)):
            sql_list.append(sql)
        i += 1
    
    with open('sql_venues.js', 'w') as h:
        h.write("var sql_venues = [\n")
        for sql in sql_list:
            #sql = sql.encode('utf-8')
            #sql = sql.encode('unicode-escape')
            sql =  unicodedata.normalize('NFKD', sql).encode('ASCII', 'ignore')
            try:
                h.write("\"" + sql + "\",\n")
            except:
                import ipdb;ipdb.set_trace()
                print sql
        h.write(']')

def dump_artists():
    i = 1
    sql_list = []
    sql = ""
    rows = cur.execute("select * from ARTISTS").fetchall()
    print len(rows)
    for row in rows:
        name, genre, mbid, listener, playcount = row[0:5]
        #name = name.encode("unicode-escape")
        #print name
        
        if i==1 or i%320 == 1:
            sql = """INSERT INTO ARTISTS select \\"%s\\" as name, \\"%s\\" as genre, %d as listener, %d as playcount, \\"%s\\" as mbid """% (name, genre, listener, playcount, mbid)
        else:
            sql += """UNION SELECT \\"%s\\", \\"%s\\", %d, %d, \\"%s\\" """% (name, genre, listener, playcount, mbid)
        if i%320==0 or i == (len(rows)):
            sql_list.append(sql)
        #if name[0:4]=="Beyo":
        #    import ipdb;ipdb.set_trace()
        i += 1
    
    with open('sql_artists.js', 'w') as h:
        h.write("var sql_artists = [\n")
        for sql in sql_list:
            #sql = sql.encode('utf-8').decode('utf-8')
            #sql = sql.encode('unicode-escape')
            sql =  unicodedata.normalize('NFKD', sql).encode('ASCII', 'ignore')
            h.write("\"" + sql + "\",\n")
            """
            try:
                h.write("\"" + sql + "\",\n")
            except:
                #import ipdb;ipdb.set_trace()
                print sql
                """
        h.write(']')
        
def dump_events():
    i = 1
    sql_list = []
    sql = ""
    #rows = cur.execute("select * from EVENTS").fetchall()
    rows = cur.execute("select * from EVENTS a join ARTISTS b on a.headline_artist = b.name").fetchall()
    print len(rows)
    for row in rows:
        (id, title,date,headliner,venue_id),image,cancelled = row[0:5],row[6], row[12]
        #title = title.encode('unicode-escape')
        #headliner = headliner.encode('unicode-escape')
        #print name
        
        if i==1 or i%320 == 1:
            sql = """INSERT INTO EVENTS select %d as event_id, \\"%s\\" as title, \\"%s\\" as date, \\"%s\\" as headliner, %d as venue_id, \\"%s\\" as image, \\"%s\\" as cancelled """% (id, title,date,headliner,venue_id,image,cancelled)
        else:
            sql += """UNION SELECT %d, \\"%s\\", \\"%s\\", \\"%s\\", %d, \\"%s\\", \\"%s\\"  """% (id, title,date,headliner,venue_id,image,cancelled)
        if i%320==0 or i == (len(rows)):
            sql_list.append(sql)
        i += 1
    
    with open('sql_events.js', 'w') as h:
        h.write("var sql_events = [\n")
        for sql in sql_list:
            #sql = sql.encode('utf-8')
            #sql = sql.encode('unicode-escape')
            sql = sql.replace("\n","")
            sql =  unicodedata.normalize('NFKD', sql).encode('ASCII', 'ignore')
            try:
                h.write("\"" + sql + "\",\n")
            except:
                #import ipdb;ipdb.set_trace()
                print sql
        h.write(']')
        
dump_artists()
dump_venues()
dump_events()

"""
events = []
for row in cur.execute("select * from EVENTS a join ARTISTS b on a.headline_artist = b.name"):
    #print row
    (id, title,date,headliner,venue_id),image,cancelled = row[0:5],row[6], row[12]
    event = {
             'event_id': id,
             'title': title,
             'date': date,
             'headliner': headliner,
             'venue_id': venue_id,
             'image':image,
             'cancelled': cancelled
             }
    events.append(event)
    
with open("json_events.js",'w') as h: 
    h.write("var events = " + json.dumps(events,indent=4))

"""   
        