import sqlite3 as lite
import simplejson as json

con = lite.connect("lastfmDB.db")
cur = con.cursor()


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


artists = []
for row in cur.execute("select * from ARTISTS"):
    #print row
    name, genre, mbid, listener, playcount = row[0:5]
    artist = {
             'name': name,
             'genre': genre,
             'mbid': mbid,
             'listener': listener,
             'playcount': playcount
             }
    artists.append(artist)
    
with open("json_artists.js",'w') as h: 
    h.write("var artists = " + json.dumps(artists,indent=4))

venues = []
for row in cur.execute("select * from VENUES"):
    (id, name), website, (city, country, street, postal, lat, long) = \
                                                row[0:2], row[3], row[5:11]
    venue = {
             'venue_id': id,
             'name': name,
             'website': website,
             'city': city,
             'country': country,
             'street': street,
             'postal': postal,
             'location':{
                         'lat': lat,
                         'long': long
                         }
             }
    venues.append(venue)    

with open("json_venues.js",'w') as h: 
    h.write("var venues = " + json.dumps(venues,indent=4))
    